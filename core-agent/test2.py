from utils.security_utils import encrypt_token, decrypt_token

token = "sensitive_data_123"
encrypted_token, iv = encrypt_token(token)
decrypted_token = decrypt_token(encrypted_token, iv)
print(decrypted_token)  # Output: sensitive_data_123
