"""User-supplied reference excerpts; never silently described as verified OEM data."""
import re
from uuid import uuid4

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, ConfigDict, Field, HttpUrl

from .arena_workflow.security_routes import User, get_current_user, require_admin

router = APIRouter(prefix='/api/documents', tags=['Maintenance references'])


class DocumentInput(BaseModel):
    model_config = ConfigDict(extra='forbid', str_strip_whitespace=True)
    title: str = Field(min_length=1, max_length=200)
    source: str = Field(min_length=1, max_length=500, description='Document title, revision, section or page')
    source_url: HttpUrl | None = None
    text: str = Field(min_length=20, max_length=20000)


def search(store, query, limit=5):
    words = set(re.findall(r'[a-z0-9]{3,}', query.lower()))
    matches = []
    for doc in store.list('document', 1000):
        for index, paragraph in enumerate(re.split(r'\n\s*\n', doc['text'])):
            for start in range(0, len(paragraph), 1200):
                excerpt = paragraph[start:start + 1200]
                score = len(words & set(re.findall(r'[a-z0-9]{3,}', (doc['title'] + ' ' + excerpt).lower())))
                if score:
                    matches.append({'document_id': doc['id'], 'title': doc['title'], 'source': doc['source'],
                        'source_url': doc.get('source_url'), 'excerpt': excerpt, 'score': score,
                        'excerpt_id': f"{doc['id']}:{index}:{start}", 'verification': 'user_supplied'})
    return sorted(matches, key=lambda item: item['score'], reverse=True)[:limit]


@router.post('', status_code=201)
def add_document(payload: DocumentInput, request: Request, user: User = Depends(require_admin)):
    from .integrated_server import now
    result = {**payload.model_dump(mode='json'), 'id': 'DOC-' + uuid4().hex,
              'created_at': now(), 'verification': 'user_supplied'}
    request.app.state.store.save('document', result)
    return result


@router.get('')
def documents(request: Request, user: User = Depends(get_current_user)):
    return request.app.state.store.list('document', 100)


@router.get('/search')
def search_documents(request: Request, q: str = Query('', max_length=1000), user: User = Depends(get_current_user)):
    return {'query': q, 'matches': search(request.app.state.store, q),
            'disclaimer': 'User-supplied reference excerpts, not independently verified OEM instructions.'}
