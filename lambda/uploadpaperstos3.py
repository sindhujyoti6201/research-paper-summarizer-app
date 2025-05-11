import json
import base64
import os
import boto3
import time
import re
import io
from botocore.exceptions import ClientError
from PyPDF2 import PdfReader

s3 = boto3.client('s3')
sqs = boto3.client('sqs')

def lambda_handler(event, context):
    try:
        print(f"Received event: {json.dumps(event)}")

        if event.get('httpMethod') == 'OPTIONS':
            print("Handling CORS preflight request")
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
                    'Access-Control-Allow-Methods': 'POST,OPTIONS',
                    'Access-Control-Max-Age': '3600'
                },
                'body': ''
            }

        if 'body' not in event:
            raise Exception("Missing request body")

        body = json.loads(event['body'])
        print(f"Parsed request body: {body.keys()}")

        file_name = body.get('fileName')
        content_type = body.get('contentType')
        base64_data = body.get('base64Data')

        email = body.get('email')
        if not email:
            raise Exception("Missing required field: email")
        print(f"Email received: {email}")

        if not file_name or not content_type or not base64_data:
            raise Exception("Missing required fields: fileName, contentType, or base64Data")
        if content_type != 'application/pdf':
            raise Exception("Only PDF files are allowed")

        timestamp = int(time.time() * 1000)
        sanitized_file_name = f"{timestamp}-{re.sub(r'[^a-zA-Z0-9._-]', '_', file_name)}"
        print(f"Sanitized file name: {sanitized_file_name}")

        try:
            file_content = base64.b64decode(base64_data)
            print(f"Base64 decoded, file size: {len(file_content)} bytes")
        except Exception as e:
            raise Exception(f"Error decoding base64 data: {str(e)}")

        file_size_mb = len(file_content) / (1024 * 1024)
        if file_size_mb > 10:
            raise Exception("File size exceeds the 10MB limit")

        pdf_reader = PdfReader(io.BytesIO(file_content))
        extracted_text = ""
        for i, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            print(f"Page {i + 1} text extracted: {len(page_text) if page_text else 0} characters")
            if page_text:
                extracted_text += page_text + "\n"

        if not extracted_text.strip():
            raise Exception("Could not extract any text from the PDF")

        sanitized_txt_file_name = re.sub(r'\.pdf$', '', sanitized_file_name, flags=re.IGNORECASE) + '.txt'

        bucket_name = os.environ.get('S3_BUCKET_NAME')
        aws_region = os.environ.get('AWS_REGION', 'us-east-1')
        if not bucket_name:
            raise Exception("S3_BUCKET_NAME environment variable is not set")
        print(f"Uploading to S3 bucket: {bucket_name}, region: {aws_region}")

        try:
            s3.put_object(
                Bucket=bucket_name,
                Key=sanitized_txt_file_name,
                Body=extracted_text.encode('utf-8'),
                ContentType='text/plain',
                Metadata={
                    'original-filename': file_name,
                    'upload-date': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
                }
            )
            print(f"Successfully uploaded {sanitized_txt_file_name} to S3")
        except ClientError as e:
            print(f"S3 upload error: {str(e)}")
            raise Exception(f"Error uploading to S3: {str(e)}")

        try:
            queue_url = os.environ.get('SQS_QUEUE_URL')
            if not queue_url:
                raise Exception("SQS_QUEUE_URL environment variable is not set")
            print(f"Using SQS queue URL: {queue_url}")

            message_payload = {
            'event': 'FileUploaded',
            'fileName': sanitized_txt_file_name,
            'originalName': file_name,
            'bucket': bucket_name,
            'timestamp': timestamp,
            'email': email
            }
            print(f"Message body sent to SQS:\n{json.dumps(message_payload, indent=2)}")

            response = sqs.send_message(
                QueueUrl=queue_url,
                MessageBody=json.dumps(message_payload)
            )
            print(f"Message sent to SQS. Message ID: {response.get('MessageId')}")
        except ClientError as e:
            print(f"Failed to send message to SQS: {str(e)}")

        file_url = f"https://{bucket_name}.s3.{aws_region}.amazonaws.com/{sanitized_txt_file_name}"
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'PDF converted and uploaded as .txt successfully',
                'fileUrl': file_url,
                'fileName': sanitized_txt_file_name,
                'originalName': file_name
            })
        }

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Error processing file',
                'error': str(e)
            })
        }
