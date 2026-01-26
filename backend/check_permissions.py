import socket
import os

print("Checking .env access:")
try:
    with open(".env", "r") as f:
        print("Success reading .env")
except Exception as e:
    print(f"Failed reading .env: {e}")

print("Checking port binding:")
try:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 5173))
    print("Success binding 5173")
    s.close()
except Exception as e:
    print(f"Failed binding 5173: {e}")
