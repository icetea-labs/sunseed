# Về việc hỗ trợ inheritance

Hiện tại, giả sử có đoạn code sau.
```js
class A {
   @state a
   @transaction doA() {
   }
}

@contract class B extends A {
   @state b
   @view doB() {
   }
}
```

Khi transpile đoạn code này thì có vài vấn đề:
1. Các decorator trong class A không được xử lý (ví nó không được mark là @contract)
2. Metadata của B sẽ không có các function thừa kế từ class A.

Mong muốn:
1. Sửa thành decorator trong __MỌI__ class đều được xử lý
2. Kết hợp metadata để lấy đầy đủ metadata cho @contract
