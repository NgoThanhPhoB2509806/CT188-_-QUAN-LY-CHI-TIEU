# FinMate - Website quản lý chi tiêu cá nhân

## Công nghệ
- HTML5
- CSS3
- JavaScript thuần
- Chart.js (biểu đồ qua CDN)

## Cách chạy
1. Giải nén thư mục `QuanLyChiTieu`.
2. Mở `index.html` bằng Chrome, Edge hoặc Firefox.
3. Cần kết nối Internet để tải Google Fonts và Chart.js từ CDN; phần giao dịch vẫn có thể dùng ngoại tuyến nhưng biểu đồ cần Chart.js được tải thành công.

## Chức năng
- Tổng quan thu nhập, chi tiêu, số dư và ngân sách
- Thêm, sửa, xóa giao dịch
- Tìm kiếm, lọc theo loại, danh mục và tháng
- Biểu đồ thu chi theo ngày, cơ cấu danh mục, so sánh 6 tháng
- Quản lý ngân sách theo danh mục
- Mục tiêu tiết kiệm và cập nhật tiến độ
- Phân tích tài chính theo quy tắc (không phải mô hình AI tạo sinh)
- Xuất giao dịch ra CSV
- Lưu dữ liệu bằng localStorage trên trình duyệt

## Lưu ý đồ án
- Dữ liệu mặc định là dữ liệu minh họa; có thể xóa hoặc chỉnh sửa.
- localStorage chỉ lưu trên trình duyệt và thiết bị hiện tại, không có đồng bộ tài khoản.
- Không nhập thông tin tài khoản ngân hàng, mật khẩu ngân hàng hoặc dữ liệu nhạy cảm.
- Nếu tích hợp AI tạo sinh thật, gọi API từ backend và không để API key trong app.js.
