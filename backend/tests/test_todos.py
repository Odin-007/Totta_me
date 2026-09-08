"""Tests for the todos CRUD routes, as a representative shared-data resource."""


def test_todos_require_authentication(client):
    response = client.get("/api/todos")
    assert response.status_code == 401


def test_create_list_update_delete_todo(client, auth_headers):
    create_response = client.post(
        "/api/todos", json={"title": "Plan anniversary dinner"}, headers=auth_headers
    )
    assert create_response.status_code == 200
    todo = create_response.json()
    assert todo["title"] == "Plan anniversary dinner"
    assert todo["completed"] is False

    list_response = client.get("/api/todos", headers=auth_headers)
    assert list_response.status_code == 200
    ids = [item["id"] for item in list_response.json()]
    assert todo["id"] in ids

    update_response = client.patch(
        f"/api/todos/{todo['id']}", json={"completed": True}, headers=auth_headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["completed"] is True

    delete_response = client.delete(f"/api/todos/{todo['id']}", headers=auth_headers)
    assert delete_response.status_code == 200

    final_ids = [item["id"] for item in client.get("/api/todos", headers=auth_headers).json()]
    assert todo["id"] not in final_ids


def test_update_nonexistent_todo_returns_404(client, auth_headers):
    response = client.patch(
        "/api/todos/does-not-exist", json={"title": "x"}, headers=auth_headers
    )
    assert response.status_code == 404
