import json
import requests
import xml.etree.ElementTree as ET

def lambda_handler(event, context):
    
    if event.get('httpMethod', '') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps({'message': 'CORS preflight successful'})
        }

    query_url = "http://export.arxiv.org/api/query?search_query=all:machine+learning&start=0&max_results=5"

    try:
        response = requests.get(query_url)
        response.raise_for_status()
    except requests.RequestException as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            'body': json.dumps({'error': str(e)})
        }

    papers = []
    root = ET.fromstring(response.content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}

    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns).text.strip()
        summary = entry.find('atom:summary', ns).text.strip()
        authors = [author.find('atom:name', ns).text for author in entry.findall('atom:author', ns)]
        paper_url = entry.find('atom:id', ns).text

        papers.append({
            'title': title,
            'authors': authors,
            'summary': summary,
            'paper_url': paper_url
        })

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        },
        'body': json.dumps(papers)
    }
