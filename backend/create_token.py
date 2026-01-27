import jwt
import time

token = jwt.encode(
    {"sub": "user_2test123", "email": "test@example.com", "exp": time.time() + 3600},
    "secret",
    algorithm="HS256"
)
print(token)
