import os
import json
import uuid
from io import BytesIO
import boto3
import botocore.auth
import botocore.awsrequest
import urllib3

s3 = boto3.client("s3")
ses = boto3.client("ses", region_name="us-east-1")
dynamodb = boto3.resource("dynamodb")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
table = dynamodb.Table("ResearchSummaries")

MAX_CHARS_PER_CHUNK = 3000
BEDROCK_MODEL_ID = "mistral.mistral-7b-instruct-v0:2"
EMBED_MODEL_ID = "amazon.titan-embed-text-v2:0"
REGION = "us-east-1"
OPENSEARCH_HOST = "https://search-vector-search-ysdsxdpfgxvffpewxvmjc3odya.us-east-1.es.amazonaws.com"
INDEX_NAME = "research-papers"
http = urllib3.PoolManager()

def send_email(to_address, summary, s3_key):
    subject = "Your Research Summary"
    body_text = f"Here is the summary for the document stored at: {s3_key}\n\n{summary}"
    try:
        print(f"Sending email to {to_address}...")
        response = ses.send_email(
            Source=os.environ["SES_VERIFIED_SENDER"],
            Destination={"ToAddresses": [to_address]},
            Message={
                "Subject": {"Data": subject},
                "Body": {"Text": {"Data": body_text}}
            }
        )
        print(f"Email sent. Message ID: {response['MessageId']}")
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        raise

def chunk_text(text, max_chars=MAX_CHARS_PER_CHUNK):
    print("Starting text chunking...")
    chunks = []
    while len(text) > max_chars:
        split_index = text.rfind('.', 0, max_chars)
        split_index = split_index + 1 if split_index != -1 else max_chars
        chunks.append(text[:split_index].strip())
        text = text[split_index:].strip()
    if text:
        chunks.append(text)
    print(f"Chunking complete: {len(chunks)} chunks created.")
    return chunks


def call_bedrock(prompt):
    formatted_prompt = f"<s>[INST] Summarize the following:\n{prompt} [/INST]"
    body = {
        "prompt": formatted_prompt,
        "max_tokens": 1000,
        "temperature": 0.7,
        "top_p": 0.9,
        "top_k": 50
    }
    print(f"Calling Bedrock (Mistral)... Prompt length: {len(formatted_prompt)} characters")
    try:
        response = bedrock.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            contentType="application/json",
            accept="application/json",
            body=json.dumps(body)
        )
        result = json.loads(response["body"].read())
        print("Received response from Bedrock.")
        return result["outputs"][0]["text"].strip()
    except Exception as e:
        print(f"Error invoking Bedrock: {str(e)}")
        raise

def summarize_text(text):
    print("🔍 Starting summarization...")
    chunks = chunk_text(text)
    summaries = []
    for i, chunk in enumerate(chunks):
        print(f"Summarizing chunk {i+1}/{len(chunks)}...")
        summaries.append(call_bedrock(chunk))
    if len(summaries) > 1:
        print("Combining summaries and re-summarizing...")
        return call_bedrock(" ".join(summaries))
    else:
        print("Single chunk summary completed.")
        return summaries[0]

def get_embedding(text):
    payload = {"inputText": text}
    print("Getting embedding from Bedrock (Titan)...")
    response = bedrock.invoke_model(
        modelId=EMBED_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload)
    )
    return json.loads(response['body'].read())['embedding']

def sign_opensearch_request(method, url, body, service='es'):
    credentials = boto3.Session().get_credentials().get_frozen_credentials()
    request = botocore.awsrequest.AWSRequest(
        method=method,
        url=url,
        data=body,
        headers={"Host": OPENSEARCH_HOST.replace("https://", ""), "Content-Type": "application/json"}
    )
    signer = botocore.auth.SigV4Auth(credentials, service, REGION)
    signer.add_auth(request)
    return request

def index_to_opensearch(paper_id, summary, s3_key, embedding):
    document = {
        "paper_id": paper_id,
        "summary": summary,
        "s3_url": f"https://{s3_key}",
        "embedding": embedding
    }
    url = f"{OPENSEARCH_HOST}/{INDEX_NAME}/_doc/{paper_id}"
    print("Indexing into OpenSearch...")
    body = json.dumps(document).encode("utf-8")
    signed_request = sign_opensearch_request("PUT", url, body)
    response = http.request("PUT", url, body=body, headers=dict(signed_request.headers))
    print(f"OpenSearch status: {response.status}, message: {response.data.decode()}")

def store_summary_in_dynamodb(summary, bucket, key):
    print("Storing summary in DynamoDB...")
    doc_id = str(uuid.uuid4())
    try:
        table.put_item(Item={
            "id": doc_id,
            "s3_key": f"{bucket}/{key}",
            "s": summary
        })
        print(f"Summary stored successfully. ID: {doc_id}")
        return doc_id
    except Exception as e:
        print(f"Error storing in DynamoDB: {str(e)}")
        raise

def lambda_handler(event, context):
    try:
        print(f"Event received: {json.dumps(event)}")
        record = event["Records"][0]
        body = json.loads(record["body"])
        print("Parsed SQS message.")

        bucket = body.get("bucket")
        key = body.get("fileName")
        email = body.get("email")

        if not email:
            return {"statusCode": 400, "body": json.dumps({"error": "Missing 'email'"})}
        if not bucket or not key:
            return {"statusCode": 400, "body": json.dumps({"error": "Missing 'bucket' or 'key'"})}

        print(f"Reading file from S3: {bucket}/{key}")
        obj = s3.get_object(Bucket=bucket, Key=key)
        text = obj["Body"].read().decode("utf-8")

        summary = summarize_text(text)
        doc_id = store_summary_in_dynamodb(summary, bucket, key)

        embedding = get_embedding(summary)
        index_to_opensearch(doc_id, summary, f"{bucket}.s3.amazonaws.com/{key}", embedding)
        print(f"Embedding preview: {embedding[:5]}... (length: {len(embedding)})")
        send_email(email, summary, f"{bucket}/{key}")
        print("Email sent via SES.")

        return {"statusCode": 200, "body": json.dumps({"summary": summary})}

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
