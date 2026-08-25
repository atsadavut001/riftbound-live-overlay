import os
import urllib.request
import urllib.error

def download_images(prefix="OGN", start=1, end=300):
    base_url = "https://cdn.piltoverarchive.com/cards"
    
    # กำหนด path สำหรับโฟลเดอร์ image/OGN
    # ไฟล์นี้อยู่ใน scripts/ จึงอ้างอิงกลับไปที่ root แล้วเข้า image/
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    output_dir = os.path.join(project_root, "image", prefix)
    
    # สร้างโฟลเดอร์ถ้ายังไม่มี
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Starting download to {output_dir}")
    
    for i in range(start, end + 1):
        # เติม 0 ด้านหน้าให้ครบ 3 หลัก เช่น 001, 002
        num_str = f"{i:03d}"
        file_name = f"{prefix}-{num_str}.webp"
        url = f"{base_url}/{file_name}"
        out_path = os.path.join(output_dir, file_name)
        
        print(f"Downloading {file_name}...", end=" ")
        
        try:
            # เพิ่ม User-Agent ป้องกันการโดนบล็อกจากบางเว็บไซต์
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response, open(out_path, 'wb') as out_file:
                out_file.write(response.read())
            print("Success")
        except urllib.error.HTTPError as e:
            print(f"Failed (HTTP Error: {e.code})")
        except Exception as e:
            print(f"Failed ({e})")
            
    print("Download completed!")

if __name__ == "__main__":
    download_images("VEN", 1, 197)
