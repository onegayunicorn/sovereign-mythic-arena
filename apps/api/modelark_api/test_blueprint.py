from fastapi.testclient import TestClient
from modelark_api.main import app

def test_blueprint_is_ordered_and_whole_tree():
    response = TestClient(app).get("/api/blueprint")
    assert response.status_code == 200
    nodes = response.json()
    assert len(nodes) == 7
    assert [n["sort"] for n in nodes] == sorted(n["sort"] for n in nodes)
