import json
import boto3
import base64

polly = boto3.client('polly')

def lambda_handler(event, context):

    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline",
        "Accept-Ranges": "bytes"
    }

    if event['httpMethod'] == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": headers,
            "body": ""
        }

    try:
        text = ""
        if 'queryStringParameters' in event and event['queryStringParameters']:
            text = event['queryStringParameters'].get('text', '')
        
        if not text:
            return {
                "statusCode": 400,
                "headers": headers,
                "body": json.dumps({"error": "Missing 'text' parameter"})
            }

        max_length = 3000
        text_chunks = [text[i:i+max_length] for i in range(0, len(text), max_length)]
        
        audio_chunks = []
        for chunk in text_chunks:
            response = polly.synthesize_speech(
                Text=chunk,
                OutputFormat='mp3',
                VoiceId='Joanna',
                Engine='neural' 
            )
            audio_chunks.append(response['AudioStream'].read())

        combined_audio = b''.join(audio_chunks)
        encoded_audio = base64.b64encode(combined_audio).decode('utf-8')

        return {
            "statusCode": 200,
            "isBase64Encoded": True,
            "headers": headers,
            "body": encoded_audio
        }

    except Exception as e:
        print(f"Error in Lambda: {str(e)}")
        return {
            "statusCode": 500,
            "headers": headers,
            "body": json.dumps({"error": str(e)})
        }