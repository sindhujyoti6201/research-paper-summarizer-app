import os
import json
import boto3
import botocore.auth
import botocore.awsrequest
import urllib3

REGION = "us-east-1"
EMBED_MODEL_ID = "amazon.titan-embed-text-v2:0"
OPENSEARCH_HOST = "https://search-vector-search-ysdsxdpfgxvffpewxvmjc3odya.us-east-1.es.amazonaws.com"
INDEX_NAME = "research-papers"
MIN_SCORE = 0.75

bedrock = boto3.client("bedrock-runtime", region_name=REGION)
http = urllib3.PoolManager()

def get_embedding(text):
    payload = {"inputText": text}
    response = bedrock.invoke_model(
        modelId=EMBED_MODEL_ID,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(payload)
    )
    return json.loads(response['body'].read())['embedding']

def sign_request(method, url, body, service="es"):
    credentials = boto3.Session().get_credentials().get_frozen_credentials()
    request = botocore.awsrequest.AWSRequest(
        method=method,
        url=url,
        data=body,
        headers={
            "Host": OPENSEARCH_HOST.replace("https://", ""),
            "Content-Type": "application/json"
        }
    )
    signer = botocore.auth.SigV4Auth(credentials, service, REGION)
    signer.add_auth(request)
    return request

def lambda_handler(event, context):
    print(f"Lambda Event: {event}")
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"message": "CORS preflight OK"})
        }

    try:
        body = json.loads(event.get("body", "{}"))
        query = body.get("query")

        if not query:
            return {
                "statusCode": 400,
                "headers": {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type"
                },
                "body": json.dumps({"error": "Missing 'query'"})
            }

        print(f"Embedding query: {query}")
        query_embedding = get_embedding(query)
        print(f"Query embedding: {query_embedding}")

        knn_query = {
            "size": 5,
            "query": {
                "knn": {
                    "embedding": {
                        "vector": query_embedding,
                        "k": 5
                    }
                }
            }
        }

        url = f"{OPENSEARCH_HOST}/{INDEX_NAME}/_search"
        signed = sign_request("POST", url, json.dumps(knn_query))
        response = http.request("POST", url, body=json.dumps(knn_query).encode(), headers=dict(signed.headers))

        search_response = json.loads(response.data.decode())
        hits = search_response.get("hits", {}).get("hits", [])

        filtered = [
            {
                "paper_id": h["_source"].get("paper_id"),
                "summary": h["_source"].get("summary"),
                "s3_url": h["_source"].get("s3_url")
            }
            for h in hits if h.get("_score", 0) >= MIN_SCORE
        ]

        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"results": filtered})
        }

    except Exception as e:
        print(f"Search Lambda Error: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            "body": json.dumps({"error": str(e)})
        }
