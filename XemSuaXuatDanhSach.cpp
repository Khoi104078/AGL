#include <iostream>
#include <vector>
#include <string>
#include <fstream>
#include <iomanip>

using namespace std;

// Cấu trúc dữ liệu
struct NguoiThamGia {
    string mssv, hoTen, email, sdt, trangThai;
};

// --- CÁC HÀM XỬ LÝ ---

// Hàm hỗ trợ nhập chuỗi có dấu cách
string nhapChuoi() {
    string temp;
    getline(cin >> ws, temp);
    return temp;
}

// 1. Hàm thêm người tham gia
void themThanhVien(vector<NguoiThamGia> &ds) {
    NguoiThamGia p;
    cout << "Nhap MSSV: "; p.mssv = nhapChuoi();
    cout << "Nhap Ho Ten: "; p.hoTen = nhapChuoi();
    cout << "Nhap Email: "; p.email = nhapChuoi();
    cout << "Nhap SDT: "; p.sdt = nhapChuoi();
    p.trangThai = "Chua Check-in";
    ds.push_back(p);
    cout << "=> Da them thanh cong!\n";
}

// 2. Hàm hiển thị danh sách
void hienThiDanhSach(const vector<NguoiThamGia> &ds) {
    if (ds.empty()) {
        cout << "Danh sach dang trong!\n";
        return;
    }
    cout << "\n" << left << setw(5) << "STT" << setw(12) << "MSSV" << setw(25) << "Ho Ten" << "Trang Thai" << endl;
    cout << string(60, '-') << endl;
    for (int i = 0; i < ds.size(); i++) {
        cout << left << setw(5) << i + 1 << setw(12) << ds[i].mssv << setw(25) << ds[i].hoTen << ds[i].trangThai << endl;
    }
}

// 3. Hàm tìm kiếm
void timKiem(const vector<NguoiThamGia> &ds) {
    cout << "Nhap Ten hoac MSSV can tim: ";
    string tuKhoa = nhapChuoi();
    bool timThay = false;
    for (auto x : ds) {
        if (x.mssv == tuKhoa || x.hoTen.find(tuKhoa) != string::npos) {
            cout << "- Tim thay: " << x.hoTen << " | MSSV: " << x.mssv << " | " << x.trangThai << endl;
            timThay = true;
        }
    }
    if (!timThay) cout << "Khong tim thay ket qua.\n";
}

// 4. Hàm lọc theo trạng thái
void locDanhSach(const vector<NguoiThamGia> &ds) {
    cout << "Chon (1: Da Check-in, 2: Chua): ";
    int chon; cin >> chon;
    string mucTieu = (chon == 1) ? "Da Check-in" : "Chua Check-in";
    cout << "\n--- Danh sach: " << mucTieu << " ---\n";
    for (auto x : ds) {
        if (x.trangThai == mucTieu) cout << "+ " << x.hoTen << " (" << x.mssv << ")\n";
    }
}

// 5. Hàm sửa thông tin hoặc thay đổi trạng thái
void suaThongTin(vector<NguoiThamGia> &ds) {
    cout << "Nhap MSSV can sua: ";
    string ms = nhapChuoi();
    for (auto &p : ds) {
        if (p.mssv == ms) {
            cout << "1. Sua Ho Ten | 2. Check-in thu cong | 3. Sua Email/SDT\nChon: ";
            int s; cin >> s;
            if (s == 1) { cout << "Ho ten moi: "; p.hoTen = nhapChuoi(); }
            else if (s == 2) { p.trangThai = "Da Check-in"; }
            else if (s == 3) { 
                cout << "Email moi: "; p.email = nhapChuoi();
                cout << "SDT moi: "; p.sdt = nhapChuoi();
            }
            cout << "=> Cap nhat thanh cong!\n";
            return;
        }
    }
    cout << "Khong tim thay MSSV nay!\n";
}

// 6. Hàm xuất file CSV
void xuatFile(const vector<NguoiThamGia> &ds) {
    ofstream f("danh_sach.csv");
    f << "MSSV,Ho Ten,Email,SDT,Trang Thai\n";
    for (auto x : ds) {
        f << x.mssv << "," << x.hoTen << "," << x.email << "," << x.sdt << "," << x.trangThai << "\n";
    }
    f.close();
    cout << "=> Da luu file 'danh_sach.csv'. Ban co the mo bang Excel.\n";
}

// --- CHƯƠNG TRÌNH CHÍNH ---
int main() {
    vector<NguoiThamGia> danhSach;
    int luaChon;

    do {
        cout << "\n--- HE THONG QUAN LY SU KIEN ---" << endl;
        cout << "1. Them thanh vien moi" << endl;
        cout << "2. Hien thi danh sach" << endl;
        cout << "3. Tim kiem (Ten/MSSV)" << endl;
        cout << "4. Loc theo trang thai" << endl;
        cout << "5. Sua thong tin/Check-in" << endl;
        cout << "6. Xuat file Excel (CSV)" << endl;
        cout << "0. Thoat" << endl;
        cout << "Nhap lua chon: ";
        cin >> luaChon;

        switch (luaChon) {
            case 1: themThanhVien(danhSach); break;
            case 2: hienThiDanhSach(danhSach); break;
            case 3: timKiem(danhSach); break;
            case 4: locDanhSach(danhSach); break;
            case 5: suaThongTin(danhSach); break;
            case 6: xuatFile(danhSach); break;
            case 0: cout << "Tam biet!\n"; break;
            default: cout << "Lua chon khong hop le!\n";
        }
    } while (luaChon != 0);

    return 0;
}