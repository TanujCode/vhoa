import os
import shutil

src_root = r"d:\Vhoa_Management"
dest_root = r"D:\github code cc\vhoa"

# Auto-copy generated portal image wallpapers from Brain folder
brain_dir = r"C:\Users\tanuj\.gemini\antigravity-ide\brain\c0b6d5e9-bc31-4082-a932-7d0c9d5d1f0b"
local_assets = os.path.join(src_root, r"frontend\hoa-portal\src\assets")
os.makedirs(local_assets, exist_ok=True)
asset_files = {
    "solution_rental_hd_1782017602958.png": "solution_rental.png",
    "solution_condo_hd_1782017622466.png": "solution_condo.png",
    "solution_apartment_hd_1782017637978.png": "solution_apartment.png",
    "solution_hoa_hd_1782017654662.png": "solution_hoa.png"
}
for b_file, l_file in asset_files.items():
    b_path = os.path.join(brain_dir, b_file)
    l_path = os.path.join(local_assets, l_file)
    if os.path.exists(b_path):
        shutil.copy2(b_path, l_path)
        print(f"Automatically copied generated asset: {b_file} -> {l_file}")

copy_targets = [
    # (src_relative_path, dest_relative_path)
    (r"frontend\hoa-portal\src\App.jsx", r"frontend\hoa-portal\src\App.jsx"),
    (r"frontend\hoa-portal\src\index.css", r"frontend\hoa-portal\src\index.css"),
    (r"frontend\hoa-portal\public\favicon.svg", r"frontend\hoa-portal\public\favicon.svg"),
    (r"frontend\hoa-portal\public\logo_dark.png", r"frontend\hoa-portal\public\logo_dark.png"),
    (r"frontend\hoa-portal\public\logo_light.png", r"frontend\hoa-portal\public\logo_light.png"),
]

copy_dirs = [
    # (src_relative_dir, dest_relative_dir)
    (r"frontend\hoa-portal\src\pages\marketing", r"frontend\hoa-portal\src\pages\marketing"),
    (r"frontend\hoa-portal\src\components\marketing", r"frontend\hoa-portal\src\components\marketing"),
    (r"frontend\hoa-portal\src\assets", r"frontend\hoa-portal\src\assets"),
]

# Copy specific old files as per copy_to_git.bat
old_targets = [
    (r"frontend\hoa-portal\src\pages\Violations.jsx", r"frontend\hoa-portal\src\pages\Violations.jsx"),
    (r"frontend\hoa-portal\src\pages\ServiceRequests.jsx", r"frontend\hoa-portal\src\pages\ServiceRequests.jsx"),
    (r"frontend\hoa-portal\src\pages\Amenity.jsx", r"frontend\hoa-portal\src\pages\Amenity.jsx"),
    (r"frontend\hoa-portal\src\pages\Profile.jsx", r"frontend\hoa-portal\src\pages\Profile.jsx"),
    (r"frontend\hoa-portal\src\pages\auth\AdminPortal.jsx", r"frontend\hoa-portal\src\pages\auth\AdminPortal.jsx"),
    (r"frontend\hoa-portal\src\pages\auth\ClientOnboarding.jsx", r"frontend\hoa-portal\src\pages\auth\ClientOnboarding.jsx"),
    (r"frontend\hoa-portal\src\pages\auth\ForgotPassword.jsx", r"frontend\hoa-portal\src\pages\auth\ForgotPassword.jsx"),
    (r"frontend\hoa-portal\src\utils\emailValidation.js", r"frontend\hoa-portal\src\utils\emailValidation.js"),
    (r"frontend\hoa-portal\src\context\ThemeContext.jsx", r"frontend\hoa-portal\src\context\ThemeContext.jsx"),
    (r"frontend\hoa-portal\src\pages\Documents.jsx", r"frontend\hoa-portal\src\pages\Documents.jsx"),
    (r"frontend\hoa-portal\src\pages\AuditHistory.jsx", r"frontend\hoa-portal\src\pages\AuditHistory.jsx"),
    (r"frontend\hoa-portal\src\pages\Members.jsx", r"frontend\hoa-portal\src\pages\Members.jsx"),
    (r"frontend\hoa-portal\src\pages\Vendors.jsx", r"frontend\hoa-portal\src\pages\Vendors.jsx"),
    (r"frontend\hoa-portal\src\pages\Settings.jsx", r"frontend\hoa-portal\src\pages\Settings.jsx"),
    (r"backend\app\routers\service_request.py", r"backend\app\routers\service_request.py"),
    (r"backend\app\routers\payment.py", r"backend\app\routers\payment.py"),
    (r"backend\app\routers\user.py", r"backend\app\routers\user.py"),
    (r"backend\app\main.py", r"backend\app\main.py"),
    (r"backend\app\routers\amenity.py", r"backend\app\routers\amenity.py"),
    (r"backend\app\services\amenity_service.py", r"backend\app\services\amenity_service.py"),
    (r"frontend\hoa-portal\src\components\Topbar.jsx", r"frontend\hoa-portal\src\components\Topbar.jsx"),
    (r"frontend\hoa-portal\src\components\Sidebar.jsx", r"frontend\hoa-portal\src\components\Sidebar.jsx"),
    (r"frontend\hoa-portal\src\components\layout\AuthLayout.jsx", r"frontend\hoa-portal\src\components\layout\AuthLayout.jsx"),
    (r"frontend\hoa-portal\src\components\NotifPanel.jsx", r"frontend\hoa-portal\src\components\NotifPanel.jsx"),
    (r"frontend\hoa-portal\src\pages\Meetings.jsx", r"frontend\hoa-portal\src\pages\Meetings.jsx"),
    (r"frontend\hoa-portal\src\utils\phoneFormatter.js", r"frontend\hoa-portal\src\utils\phoneFormatter.js"),
    (r"frontend\hoa-portal\src\pages\auth\RegisterPage.jsx", r"frontend\hoa-portal\src\pages\auth\RegisterPage.jsx"),
    (r"frontend\hoa-portal\src\pages\Contracts.jsx", r"frontend\hoa-portal\src\pages\Contracts.jsx"),
    (r"backend\app\init_db.py", r"backend\app\init_db.py"),
    (r"backend\app\utils\user_code.py", r"backend\app\utils\user_code.py"),
    (r"backend\app\services\auth_service.py", r"backend\app\services\auth_service.py"),
    (r"backend\app\routers\auth.py", r"backend\app\routers\auth.py"),
    (r"backend\app\config.py", r"backend\app\config.py"),
    (r"backend\app\models\user.py", r"backend\app\models\user.py"),
    (r"frontend\hoa-portal\src\pages\PropertyManagerDashboard.jsx", r"frontend\hoa-portal\src\pages\PropertyManagerDashboard.jsx"),
    (r"frontend\hoa-portal\src\pages\BoardDashboard.jsx", r"frontend\hoa-portal\src\pages\BoardDashboard.jsx"),
    (r"frontend\hoa-portal\src\pages\Payments.jsx", r"frontend\hoa-portal\src\pages\Payments.jsx"),
    (r"frontend\hoa-portal\src\pages\SalesDashboard.jsx", r"frontend\hoa-portal\src\pages\SalesDashboard.jsx"),
    (r"frontend\hoa-portal\src\pages\Reports.jsx", r"frontend\hoa-portal\src\pages\Reports.jsx"),
    (r"backend\app\models\meeting_survey.py", r"backend\app\models\meeting_survey.py"),
    (r"backend\app\schemas\meeting_survey.py", r"backend\app\schemas\meeting_survey.py"),
    (r"backend\app\routers\meeting_survey.py", r"backend\app\routers\meeting_survey.py"),
    (r"frontend\hoa-portal\src\services\meetingSurveyService.js", r"frontend\hoa-portal\src\services\meetingSurveyService.js"),
    (r"backend\app\services\meeting_survey_service.py", r"backend\app\services\meeting_survey_service.py"),
    (r"backend\app\routers\vendor.py", r"backend\app\routers\vendor.py"),
    (r"backend\app\schemas\community.py", r"backend\app\schemas\community.py"),
    (r"backend\app\services\community_service.py", r"backend\app\services\community_service.py"),
    (r"frontend\hoa-portal\src\components\AiAssistant.jsx", r"frontend\hoa-portal\src\components\AiAssistant.jsx"),
    (r"backend\app\routers\community.py", r"backend\app\routers\community.py"),
    (r"backend\requirements.txt", r"backend\requirements.txt"),
    (r"backend\app\routers\report.py", r"backend\app\routers\report.py"),
    (r"frontend\hoa-portal\src\pages\Dashboard.jsx", r"frontend\hoa-portal\src\pages\Dashboard.jsx"),
    (r"backend\app\routers\location.py", r"backend\app\routers\location.py"),
    (r"frontend\hoa-portal\src\components\AddCommunityModal.jsx", r"frontend\hoa-portal\src\components\AddCommunityModal.jsx"),
    (r"backend\app\services\email_service.py", r"backend\app\services\email_service.py"),
    (r"backend\app\routers\violation.py", r"backend\app\routers\violation.py"),
]

all_targets = copy_targets + old_targets

print("=== STARTING COPY PROCESS ===")

# Copy files
for src_rel, dest_rel in all_targets:
    src_path = os.path.join(src_root, src_rel)
    dest_path = os.path.join(dest_root, dest_rel)
    
    if os.path.exists(src_path):
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        shutil.copy2(src_path, dest_path)
        print(f"Copied file: {src_rel} -> {dest_rel}")
    else:
        print(f"Warning: Source file does not exist: {src_rel}")

# Copy directories
for src_rel, dest_rel in copy_dirs:
    src_path = os.path.join(src_root, src_rel)
    dest_path = os.path.join(dest_root, dest_rel)
    
    if os.path.exists(src_path):
        if os.path.exists(dest_path):
            shutil.rmtree(dest_path)
        shutil.copytree(src_path, dest_path)
        print(f"Copied directory: {src_rel} -> {dest_rel}")
    else:
        print(f"Warning: Source directory does not exist: {src_rel}")

print("=== COPY PROCESS COMPLETED SUCCESSFULLY ===")
