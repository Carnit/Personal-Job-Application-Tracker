from locust import HttpUser, task, between


class APIUser(HttpUser):
    # Simulate a user waiting between 1 and 2 seconds between tasks
    wait_time = between(1, 2)

    @task
    def get_applications(self):
        # This hits your endpoint.
        # Redis should make this FAST (under 10ms) after the first hit.
        self.client.get("/api/applications")
