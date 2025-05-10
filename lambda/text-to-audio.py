import json
import boto3
import base64

polly = boto3.client('polly')

def lambda_handler(event, context):
    # CORS headers
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline",
        "Accept-Ranges": "bytes"
    }

    # Handle OPTIONS request for CORS preflight
    if event['httpMethod'] == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }

    try:
        # Parse text from query parameters
        text = ""
        if 'queryStringParameters' in event and event['queryStringParameters']:
            text = event['queryStringParameters'].get('text', '')
        
        if not text:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing 'text' parameter"})
            }

        # Split text into smaller chunks if it's too long (Polly has a limit)
        max_length = 3000  # Polly's limit is 3000 characters
        text_chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]
        
        # Process each chunk
        audio_chunks = []
        for chunk in text_chunks:
            response = polly.synthesize_speech(
                Text=chunk,
                OutputFormat='mp3',
                VoiceId='Joanna',
                Engine='neural'  # Use neural engine for better quality
            )
            audio_chunks.append(response['AudioStream'].read())

        # Combine audio chunks
        combined_audio = b''.join(audio_chunks)
        encoded_audio = base64.b64encode(combined_audio).decode('utf-8')

        return {
            "statusCode": 200,
            "isBase64Encoded": True,
            "headers": headers,
            "body": encoded_audio
        }

    except Exception as e:
        print(f"Error in Lambda: {str(e)}")  # This will show up in CloudWatch logs
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }