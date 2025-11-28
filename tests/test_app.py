from fastapi.testclient import TestClient
from src.app import app, activities


client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Expect to get the same keys as the in-memory activities mapping
    assert set(data.keys()) == set(activities.keys())


def test_signup_and_unregister_flow():
    activity_name = "Chess Club"
    email = "test_student@example.com"

    # Ensure email is not already registered (cleanup if necessary)
    if email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(email)

    # Sign up
    resp = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert resp.status_code == 200
    body = resp.json()
    assert "Signed up" in body.get("message", "")
    # participants should include newly added email
    assert email in body.get("participants", [])

    # Attempt duplicate signup should return 400
    dup = client.post(f"/activities/{activity_name}/signup?email={email}")
    assert dup.status_code == 400

    # Now unregister
    rem = client.delete(f"/activities/{activity_name}/participants?email={email}")
    assert rem.status_code == 200
    rbody = rem.json()
    assert "Unregistered" in rbody.get("message", "")
    assert email not in rbody.get("participants", [])


def test_unregister_not_found():
    activity_name = "Chess Club"
    email = "not_registered@example.com"

    # Make sure this email is not present
    if email in activities[activity_name]["participants"]:
        activities[activity_name]["participants"].remove(email)

    resp = client.delete(f"/activities/{activity_name}/participants?email={email}")
    assert resp.status_code == 404