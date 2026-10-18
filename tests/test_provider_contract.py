import asyncio
import json

import httpx
import pytest

from backend.intelligence.amd_engine import AMDUnavailable, diagnose_with_amd
from backend.intelligence.schemas import Detection, Telemetry


@pytest.fixture(autouse=True)
def configuration(monkeypatch):
    monkeypatch.setenv('AMD_TOKEN_FACTORY_URL', 'https://example.com/v1/chat/completions')
    monkeypatch.setenv('AMD_MODEL', 'test-model')
    monkeypatch.setenv('AMD_API_KEY', 'test-secret-not-real')
    monkeypatch.delenv('AMD_HARDWARE', raising=False)


def invoke(handler):
    async def run():
        async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
            telemetry = Telemetry(machine_id='CONV-MTR-01', timestamp='2026-10-17T10:00:00Z',
                vibration_mm_s=5, temperature=82, current_amp=21, data_source='synthetic')
            detection = Detection(is_anomaly=True, severity='CRITICAL', reasons=['Demo threshold exceeded'])
            return await diagnose_with_amd(telemetry, detection, client, context={
                'references': [{'source': 'Test note', 'excerpt': 'Bearing vibration trend review', 'verification': 'user_supplied'}],
                'recent_readings': [{'temperature': 70}, {'temperature': 82}],
            })
    return asyncio.run(run())


VALID = {'condition': 'Possible wear; qualified review required', 'possible_causes': ['Bearing wear'],
         'suggested_inspections': ['Review trends'], 'limitations': ['Synthetic data'], 'requires_human_review': True}


def test_provider_payload_includes_untrusted_references_and_trends():
    def handler(request):
        payload = json.loads(request.content)
        context = json.loads(payload['messages'][1]['content'])
        assert context['context']['references'][0]['verification'] == 'user_supplied'
        assert len(context['context']['recent_readings']) == 2
        assert context['telemetry']['vibration_mm_s'] == 5
        assert 'untrusted data' in payload['messages'][0]['content']
        return httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(VALID)}}], 'usage': {'completion_tokens': 42}})
    diagnosis, metrics = invoke(handler)
    assert diagnosis.requires_human_review
    assert metrics.completion_tokens == 42
    assert metrics.hardware is None


@pytest.mark.parametrize('status', [401, 429, 500])
def test_provider_errors_are_sanitized(status):
    with pytest.raises(AMDUnavailable) as error:
        invoke(lambda request: httpx.Response(status, text='test-secret-not-real'))
    assert 'test-secret-not-real' not in str(error.value)


@pytest.mark.parametrize('content', ['not json', '{}', json.dumps({**VALID, 'requires_human_review': False})])
def test_invalid_provider_output_rejected(content):
    with pytest.raises(AMDUnavailable):
        invoke(lambda request: httpx.Response(200, json={'choices': [{'message': {'content': content}}]}))


def test_missing_metrics_stay_unavailable():
    _, metrics = invoke(lambda request: httpx.Response(200, json={'choices': [{'message': {'content': json.dumps(VALID)}}]}))
    assert metrics.completion_tokens is None
    assert metrics.end_to_end_tokens_per_sec is None
