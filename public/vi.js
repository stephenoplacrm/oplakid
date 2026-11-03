'use strict';
/* Kho chữ tiếng Việt cho Cấp độ 6 đến 10. Chỉ dùng tục ngữ, ca dao, đồng dao, thành ngữ dân gian và câu văn tự viết. */
(function (root) {
  var topics = {
    family: ['ba', 'mẹ', 'anh', 'chị', 'em', 'ông nội', 'bà ngoại', 'cô', 'chú', 'bác', 'cậu', 'em bé', 'anh trai', 'chị gái'],
    animals: ['con mèo', 'con chó', 'con gà', 'con vịt', 'con heo', 'con bò', 'con trâu', 'con ngựa', 'con thỏ', 'con voi', 'con hổ', 'con khỉ', 'con cá', 'con chim', 'con ếch', 'con rùa', 'con bướm', 'con ong'],
    fruit: ['trái cam', 'trái chuối', 'trái xoài', 'trái dừa', 'trái bưởi', 'trái ổi', 'trái mận', 'trái nho', 'dưa hấu', 'thanh long', 'trái thơm', 'chôm chôm', 'măng cụt', 'sầu riêng', 'trái mít', 'trái táo'],
    food: ['cơm', 'phở', 'bún', 'bánh mì', 'bánh bao', 'chè', 'canh chua', 'cá kho', 'thịt kho', 'rau muống', 'trứng chiên', 'sữa', 'nước cam', 'kẹo', 'bánh chưng', 'xôi'],
    school: ['trường học', 'lớp học', 'cô giáo', 'thầy giáo', 'bạn bè', 'sách vở', 'bút chì', 'cái cặp', 'thước kẻ', 'bảng đen', 'bài tập', 'giờ ra chơi', 'tập đọc', 'làm toán', 'vẽ tranh', 'hát'],
    body: ['đầu', 'mắt', 'mũi', 'miệng', 'tai', 'tay', 'chân', 'bụng', 'lưng', 'răng', 'tóc', 'cổ', 'vai', 'ngón tay', 'đầu gối'],
    nature: ['mặt trời', 'mặt trăng', 'ngôi sao', 'bầu trời', 'đám mây', 'cơn mưa', 'ngọn gió', 'dòng sông', 'ngọn núi', 'cánh đồng', 'bông hoa', 'cái cây', 'biển cả', 'con đường', 'khu rừng', 'hòn đá'],
    colors: ['màu đỏ', 'màu cam', 'màu vàng', 'màu xanh lá', 'màu xanh dương', 'màu tím', 'màu hồng', 'màu nâu', 'màu trắng', 'màu đen', 'màu xám'],
    numbers: ['một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín', 'mười', 'mười một', 'hai mươi', 'một trăm', 'một nghìn'],
    jobs: ['bác sĩ', 'y tá', 'giáo viên', 'nông dân', 'công nhân', 'kỹ sư', 'ca sĩ', 'nhà báo', 'đầu bếp', 'phi công', 'lính cứu hỏa', 'tài xế', 'thợ may', 'thợ mộc', 'họa sĩ', 'công an']
  };
  /* Các tiếng đơn giúp luyện từng dấu và từng chữ có mũ, móc */
  var extra = ['cây', 'mây', 'ngày', 'đây', 'vâng', 'mận', 'gấu', 'sâu', 'dâu', 'câu', 'cầu', 'thân', 'bầu', 'xấu', 'ấm', 'lấy', 'nhân', 'chân', 'hầu', 'tấm',
    'ếch', 'đêm', 'bến', 'nghề', 'quê', 'tên', 'đến', 'lên', 'hết', 'nền', 'xếp', 'kể', 'bế', 'thế', 'về', 'lê', 'mệt', 'việc',
    'ông', 'bốn', 'cô', 'tô', 'nồi', 'cổ', 'đồng', 'hồ', 'tối', 'lối', 'rồi', 'đồ', 'đốt', 'sống', 'bồ', 'nổ', 'trống', 'lông', 'tôm',
    'ăn', 'năm', 'răng', 'trăng', 'măng', 'khăn', 'nắng', 'mặt', 'bắp', 'đắng', 'lắm', 'cặp', 'cắt', 'chăn', 'văn', 'tắm', 'rắn', 'vắng',
    'mơ', 'bơ', 'cơm', 'thơm', 'sơn', 'nhớ', 'mới', 'trời', 'đời', 'bờ', 'ơn', 'lớp', 'chợ', 'hơn', 'rơm', 'cờ', 'ớt', 'lợn', 'mời', 'bơi', 'nơi', 'đơn', 'thở',
    'chữ', 'mưa', 'thư', 'sữa', 'đưa', 'cưa', 'trưa', 'sứ', 'thử', 'từ', 'mừng', 'vườn', 'hương', 'nước', 'người', 'bướm', 'lửa', 'tựa', 'gừng', 'sừng', 'đứng', 'chưa', 'rừng', 'bưởi',
    'đi', 'đó', 'đầu', 'đường', 'đèn', 'đũa', 'đẹp', 'đỏ', 'đất', 'đá', 'đàn', 'đủ', 'điện', 'đọc', 'đếm', 'đỉnh', 'đảo',
    'hoa', 'xe', 'nhà', 'sách', 'bàn', 'ghế', 'cửa', 'mèo', 'gà', 'vịt', 'heo', 'bò', 'cá', 'chim', 'hổ', 'khỉ', 'thỏ', 'voi', 'cua', 'sao', 'gió', 'sông', 'núi', 'biển',
    'lá', 'cành', 'quả', 'trái', 'hạt', 'cỏ', 'rau', 'củ', 'bông', 'hỏi', 'ngã', 'nặng', 'sắc', 'huyền', 'quả', 'giờ', 'hòa', 'khỏe', 'thủy', 'múa', 'mía', 'tuần', 'quý', 'nghỉ', 'bảy', 'sáu', 'tám', 'chín', 'mười'];
  var words2 = ['học sinh', 'bạn bè', 'gia đình', 'quê hương', 'trường học', 'sân trường', 'thư viện', 'bài học', 'cuốn sách', 'chiếc bút', 'cái bàn', 'ghế đá', 'cây xanh', 'bông hoa', 'trái tim', 'niềm vui', 'nụ cười', 'ánh sáng', 'bầu trời', 'mặt trăng',
    'đám mây', 'cơn gió', 'dòng sông', 'ngọn núi', 'cánh đồng', 'con đường', 'ngôi nhà', 'mái nhà', 'cửa sổ', 'giường ngủ', 'bàn học', 'tủ sách', 'xe đạp', 'xe máy', 'ô tô', 'máy bay', 'tàu hỏa', 'thuyền buồm', 'bến xe', 'nhà ga',
    'siêu thị', 'bệnh viện', 'bưu điện', 'công viên', 'sở thú', 'hồ nước', 'cầu vồng', 'thiên nhiên', 'mùa xuân', 'mùa hạ', 'mùa thu', 'mùa đông', 'ngày mai', 'buổi sáng', 'buổi tối', 'trái đất', 'thế giới', 'đất nước', 'tổ quốc',
    'thành phố', 'nông thôn', 'làng quê', 'bãi cát', 'hòn đảo', 'con tàu', 'ngôi sao', 'vũ trụ', 'người bạn', 'cuộc sống', 'tình yêu', 'sức khỏe', 'tiếng Việt', 'chữ viết', 'nước mắt', 'giấc mơ', 'cuộc thi', 'điểm mười', 'niềm tin', 'nghề nghiệp'];
  var phrases = {
    family: ['em yêu ba mẹ', 'ông bà kể chuyện', 'chị dắt em đi', 'anh chơi với em', 'mẹ nấu cơm ngon', 'ba đưa em đi học', 'cả nhà ăn cơm', 'bà ngoại thương em'],
    school: ['em đến trường', 'cô giáo giảng bài', 'bạn cùng lớp', 'giờ ra chơi', 'em làm bài tập', 'đọc sách mỗi ngày', 'viết chữ đẹp', 'giữ gìn sách vở'],
    nature: ['trời xanh mây trắng', 'mưa rơi tí tách', 'gió thổi nhẹ nhàng', 'hoa nở đầy vườn', 'chim hót líu lo', 'nắng vàng rực rỡ', 'sông chảy hiền hòa', 'trăng sáng vằng vặc'],
    food: ['bát cơm nóng hổi', 'canh chua cá lóc', 'bánh mì thịt nướng', 'nước dừa mát lạnh', 'trái cây tươi ngon', 'chè đậu xanh', 'xôi gà thơm phức', 'rau xanh tươi mát'],
    play: ['đá bóng ngoài sân', 'nhảy dây cùng bạn', 'chơi cờ vua', 'thả diều trên đồng', 'đạp xe quanh hồ', 'xếp hình rô bốt', 'vẽ tranh tặng mẹ', 'hát múa vui vẻ']
  };
  var short = {
    family: ['Em yêu ba mẹ.', 'Ba mẹ rất thương em.', 'Bà kể chuyện cho em nghe.', 'Anh chị chơi với em.', 'Chủ nhật cả nhà đi chơi.', 'Mẹ nấu cơm rất ngon.', 'Ông đọc báo trong vườn.', 'Em giúp mẹ quét nhà.'],
    school: ['Em đi học mỗi ngày.', 'Cô giáo dạy em đọc.', 'Em có nhiều bạn tốt.', 'Giờ ra chơi vui quá.', 'Em viết bài rất đẹp.', 'Cặp sách của em màu xanh.', 'Em làm bài tập về nhà.', 'Lớp em sạch sẽ.'],
    nature: ['Trời hôm nay rất đẹp.', 'Mặt trời mọc đằng đông.', 'Mưa rơi trên mái nhà.', 'Gió thổi qua cánh đồng.', 'Hoa nở đỏ cả vườn.', 'Con sông chảy hiền hòa.', 'Ngọn núi cao vời vợi.', 'Ánh trăng sáng quá.'],
    food: ['Em thích ăn trái cây.', 'Cơm trưa nay rất ngon.', 'Mẹ nấu canh chua cá.', 'Bánh mì thơm giòn.', 'Em uống một ly sữa.', 'Ba mua dưa hấu ngọt.', 'Phở bò nóng hổi.', 'Chè đậu xanh mát lạnh.'],
    play: ['Em chơi đá bóng với bạn.', 'Chúng em nhảy dây ngoài sân.', 'Bạn Nam thả diều rất giỏi.', 'Em thích vẽ tranh.', 'Cả lớp cùng hát vang.', 'Em đạp xe quanh công viên.', 'Mình chơi cờ vua nhé.', 'Chiều nay em đi bơi.']
  };
  var long = {
    family: ['Buổi tối, cả nhà em quây quần bên mâm cơm ấm áp.', 'Mỗi sáng, ba chở em đến trường bằng chiếc xe máy cũ.', 'Bà ngoại thường kể cho em nghe những câu chuyện cổ tích.', 'Cuối tuần, em cùng mẹ đi chợ mua rau và trái cây.', 'Anh trai em học rất giỏi và luôn giúp em làm bài tập.', 'Ông nội trồng nhiều hoa trong khu vườn nhỏ sau nhà.', 'Em luôn nhớ lời ba mẹ dặn là phải ngoan và chăm học.', 'Sinh nhật em, cả nhà tặng em một chiếc xe đạp mới.'],
    school: ['Sáng nào em cũng đến lớp thật sớm để chào cô giáo.', 'Trong giờ ra chơi, chúng em nhảy dây và đá cầu ngoài sân trường.', 'Cô giáo khen em viết chữ đẹp và đọc bài rõ ràng.', 'Em rất thích học môn Toán và môn Tiếng Việt.', 'Thư viện của trường có nhiều cuốn sách hay và đẹp.', 'Em giữ gìn sách vở sạch sẽ và gọn gàng.', 'Cả lớp em cùng nhau trồng cây xanh trong sân trường.', 'Mỗi chiều, em ôn lại bài học trước khi đi ngủ.'],
    nature: ['Mùa xuân đến, trăm hoa đua nở khắp các nẻo đường.', 'Những đám mây trắng trôi lững lờ trên bầu trời xanh.', 'Sau cơn mưa, cầu vồng hiện lên thật rực rỡ.', 'Dòng sông quê em êm đềm chảy qua cánh đồng lúa.', 'Buổi sáng, chim hót líu lo trên những cành cây.', 'Biển xanh trải dài đến tận chân trời xa tít.', 'Trăng rằm tròn vành vạnh chiếu sáng cả khu làng.', 'Gió mùa đông bắc thổi lạnh buốt suốt đêm dài.'],
    season: ['Mùa hè, ve kêu râm ran trên những tán phượng đỏ.', 'Mùa thu, lá vàng rơi đầy trên con đường nhỏ.', 'Mùa đông, em mặc áo ấm và đội mũ len.', 'Trời nắng chang chang, ai cũng muốn tìm bóng mát.', 'Cơn bão đi qua để lại nhiều cành cây gãy.', 'Sương sớm phủ trắng trên đồng cỏ xanh mướt.', 'Mưa rào ào ào rồi tạnh ngay trong chốc lát.', 'Tiết trời se lạnh báo hiệu mùa đông đã về.'],
    sport: ['Hôm nay lớp em thi đấu bóng đá với lớp bên cạnh.', 'Em tập chạy mỗi sáng để cơ thể thêm khỏe mạnh.', 'Bạn Lan nhảy dây giỏi nhất trong cả lớp em.', 'Chúng em kéo co và cùng reo hò thật vui vẻ.', 'Thầy thể dục hướng dẫn em cách đá cầu đúng kỹ thuật.', 'Em bơi qua hồ nước mà không thấy mệt chút nào.', 'Đội của em giành chiến thắng nhờ tinh thần đoàn kết.', 'Chơi thể thao giúp em ăn ngon và ngủ ngon hơn.'],
    food: ['Mẹ nấu một nồi canh chua cá lóc thơm lừng cả bếp.', 'Buổi sáng, em ăn một tô phở nóng và uống ly sữa.', 'Trái xoài chín vàng ươm ngọt lịm trong miệng em.', 'Ngày Tết, nhà em gói bánh chưng và nấu nồi thịt kho.', 'Bà làm món chè đậu xanh mát lạnh cho cả nhà.', 'Em thích ăn rau muống xào tỏi với cơm trắng.', 'Quán bên đường bán bánh mì giòn rụm và đậm đà.', 'Ăn nhiều rau và trái cây giúp em mau lớn.'],
    animals: ['Chú mèo con nằm cuộn tròn bên cạnh bếp lửa hồng.', 'Đàn gà con chạy theo mẹ kiếm ăn trong sân.', 'Con trâu hiền lành cần mẫn kéo cày trên đồng.', 'Chú chim sơn ca hót vang trên cành cao.', 'Những chú cá nhỏ bơi lội tung tăng trong hồ.', 'Chú chó nhà em rất thông minh và trung thành.', 'Đàn ong chăm chỉ bay đi tìm mật hoa.', 'Con voi to lớn nhưng rất hiền và thân thiện.']
  };
  var givenNames = ['Nam', 'Mai', 'Lan', 'Minh', 'Hoa', 'An', 'Linh', 'Long', 'Hùng', 'Dũng', 'Trang', 'Thảo', 'Phương', 'Quỳnh', 'Khoa', 'Tuấn', 'Bảo', 'Ngọc', 'Hạnh', 'Đạt', 'Yến', 'Vy', 'Khánh', 'Phúc', 'Thư', 'Huy'];
  var surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Ngô', 'Dương', 'Lý'];
  var places = ['Hà Nội', 'Hải Phòng', 'Đà Nẵng', 'Huế', 'Cần Thơ', 'Nha Trang', 'Đà Lạt', 'Vũng Tàu', 'Hạ Long', 'Quy Nhơn', 'Phú Quốc', 'Cà Mau', 'Bến Tre', 'Long An', 'Tiền Giang', 'Vĩnh Long', 'Đồng Tháp', 'An Giang', 'Kiên Giang', 'Bạc Liêu', 'Sóc Trăng', 'Tây Ninh', 'Biên Hòa', 'Thủ Đức'];
  var days = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  var months = ['Tháng Một', 'Tháng Hai', 'Tháng Ba', 'Tháng Tư', 'Tháng Năm', 'Tháng Sáu', 'Tháng Bảy', 'Tháng Tám', 'Tháng Chín', 'Tháng Mười', 'Tháng Mười Một', 'Tháng Mười Hai'];
  var punct = {
    comma: ['Mẹ mua cam, táo, nho và xoài.', 'Hôm nay, em được điểm mười.', 'Sáng nay, trời mưa to.', 'Ở nhà, em giúp mẹ nấu cơm.', 'Em thích đọc truyện, vẽ tranh và hát.', 'Chiều đến, đàn chim bay về tổ.', 'Cô giáo mặc áo dài, tóc búi cao.', 'Bạn Lan, bạn Mai và em chơi cùng nhau.'],
    question: ['Bạn tên là gì?', 'Hôm nay bạn học môn gì?', 'Nhà bạn ở đâu?', 'Bạn có thích ăn xoài không?', 'Ai làm bài xong rồi?', 'Mấy giờ thì ra chơi?', 'Con mèo đang ở đâu?', 'Vì sao bầu trời màu xanh?'],
    exclaim: ['Chúc mừng sinh nhật!', 'Giỏi quá!', 'Cố lên nào!', 'Đẹp quá!', 'Cảm ơn bạn nhiều!', 'Trời ơi, mưa to quá!', 'Mình thắng rồi!', 'Chào mừng các bạn đến lớp!'],
    colon: ['Em có ba màu: đỏ, vàng, xanh.', 'Mẹ dặn: nhớ mặc áo ấm.', 'Lớp em có hai tổ: tổ một và tổ hai.', 'Bài hôm nay: tập đọc.', 'Thực đơn: cơm, canh, cá kho.', 'Đồ dùng: bút, thước, cặp sách.', 'Lưu ý: không chạy trong lớp.', 'Cô nhắc: giữ gìn sách vở.'],
    quote: ['Mẹ nói: "Con ngoan lắm!"', 'Cô giáo khen: "Em viết đẹp quá!"', 'Bạn Nam hỏi: "Cậu đi đâu đấy?"', 'Ba dặn: "Nhớ đội mũ bảo hiểm."', 'Bà cười: "Cháu của bà giỏi thật!"', 'Em reo lên: "Tuyệt vời!"'],
    dash: ['- Con ăn cơm chưa? - Dạ, con ăn rồi.', '- Bạn tên là gì? - Mình tên là Mai.', '- Mấy giờ rồi ạ? - Bảy giờ rồi con.', '- Cho mình mượn bút nhé? - Ừ, cậu cứ lấy.', '- Con đi học nhé! - Ừ, con đi cẩn thận.']
  };
  var qa = ['- Bạn tên là gì? - Mình tên là Nam.', '- Bạn mấy tuổi? - Mình tám tuổi.', '- Nhà bạn ở đâu? - Nhà mình ở Cần Thơ.', '- Bạn thích môn nào? - Mình thích môn Toán.', '- Bạn ăn sáng chưa? - Mình ăn rồi, cảm ơn bạn.', '- Hôm nay trời thế nào? - Trời nắng đẹp lắm.', '- Bạn có em không? - Mình có một em gái.', '- Cuối tuần bạn làm gì? - Mình đi thăm bà ngoại.'];
  var proverbs = {
    study: ['Có công mài sắt có ngày nên kim.', 'Học ăn học nói học gói học mở.', 'Đi một ngày đàng học một sàng khôn.', 'Có chí thì nên.', 'Học thầy không tày học bạn.', 'Không thầy đố mày làm nên.', 'Gần mực thì đen, gần đèn thì sáng.', 'Có học mới biết, có đi mới đến.'],
    family: ['Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra.', 'Anh em như thể tay chân, rách lành đùm bọc dở hay đỡ đần.', 'Con hiền cháu thảo.', 'Chim có tổ, người có tông.', 'Ăn quả nhớ kẻ trồng cây.', 'Uống nước nhớ nguồn.'],
    people: ['Lá lành đùm lá rách.', 'Thương người như thể thương thân.', 'Một cây làm chẳng nên non, ba cây chụm lại nên hòn núi cao.', 'Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.', 'Lời nói chẳng mất tiền mua, lựa lời mà nói cho vừa lòng nhau.', 'Một con ngựa đau cả tàu bỏ cỏ.', 'Nhiễu điều phủ lấy giá gương, người trong một nước phải thương nhau cùng.'],
    work: ['Tay làm hàm nhai, tay quai miệng trễ.', 'Có làm thì mới có ăn.', 'Kiến tha lâu cũng đầy tổ.', 'Chuông có đánh mới kêu, đèn có khêu mới tỏ.', 'Nước chảy đá mòn.', 'Một nắng hai sương.'],
    weather: ['Chớp đông nhay nháy, gà gáy thì mưa.', 'Mau sao thì nắng, vắng sao thì mưa.', 'Trăng quầng thì hạn, trăng tán thì mưa.', 'Chuồn chuồn bay thấp thì mưa, bay cao thì nắng, bay vừa thì râm.', 'Rét tháng ba, bà già chết cóng.', 'Tháng bảy kiến bò, chỉ lo lại lụt.']
  };
  var cadao = {
    parents: ['Công cha như núi Thái Sơn, nghĩa mẹ như nước trong nguồn chảy ra. Một lòng thờ mẹ kính cha, cho tròn chữ hiếu mới là đạo con.', 'Anh em nào phải người xa, cùng chung bác mẹ một nhà cùng thân. Yêu nhau như thể tay chân, anh em hòa thuận hai thân vui vầy.', 'Lên non mới biết non cao, nuôi con mới biết công lao mẫu từ.', 'Muốn sang thì bắc cầu kiều, muốn con hay chữ phải yêu lấy thầy.'],
    home: ['Đường vô xứ Nghệ quanh quanh, non xanh nước biếc như tranh họa đồ.', 'Gió đưa cành trúc la đà, tiếng chuông Thiên Mụ canh gà Thọ Xương. Mịt mù khói tỏa ngàn sương, nhịp chày Yên Thái mặt gương Tây Hồ.', 'Trên trời có đám mây xanh, ở giữa mây trắng, xung quanh mây vàng. Ước gì anh lấy được nàng, để anh mua gạch Bát Tràng về xây.'],
    work: ['Bầu ơi thương lấy bí cùng, tuy rằng khác giống nhưng chung một giàn.', 'Trâu ơi ta bảo trâu này, trâu ra ngoài ruộng trâu cày với ta. Cấy cày vốn nghiệp nông gia, ta đây trâu đấy ai mà quản công.'],
    animals: ['Con cò mà đi ăn đêm, đậu phải cành mềm lộn cổ xuống ao. Ông ơi ông vớt tôi nao, tôi có lòng nào ông hãy xáo măng.', 'Bao giờ cho đến tháng ba, ếch cắn cổ rắn tha ra ngoài đồng.']
  };
  var dongdao = ['Rồng rắn lên mây, có cây lúc lắc, hỏi thăm thầy thuốc, có nhà hay không?', 'Chi chi chành chành, cái đanh thổi lửa, con ngựa chết trương, ba vương ngũ đế, chấp chế đi tìm, ú tim ụ ù.',
    'Thằng Bờm có cái quạt mo, phú ông xin đổi ba bò chín trâu. Bờm rằng: Bờm chẳng lấy trâu, phú ông xin đổi một xâu cá mè.', 'Lạy trời mưa xuống, lấy nước tôi uống, lấy ruộng tôi cày, lấy bát cơm đầy, lấy khoai tôi nướng.',
    'Dung dăng dung dẻ, dắt trẻ đi chơi, đến cổng nhà trời, lạy cậu lạy mợ, cho cháu về quê, cho dê đi học, cho cóc ở nhà, cho gà bới bếp.'];
  var idioms = {
    similes1: ['Chậm như rùa.', 'Nhanh như sóc.', 'Khỏe như voi.', 'Hiền như bụt.', 'Cao như núi.', 'Nhát như thỏ.', 'Đẹp như tiên.', 'Trắng như tuyết.'],
    similes2: ['Đen như than.', 'Đỏ như son.', 'Nhẹ như lông hồng.', 'Nặng như chì.', 'Vui như hội.', 'Dai như đỉa.', 'Chăm chỉ như ong.', 'Tối như hũ nút.', 'Nhanh như gió.'],
    other: ['Ăn cháo đá bát.', 'Đi đêm có ngày gặp ma.', 'Nói có sách, mách có chứng.', 'Môi hở răng lạnh.', 'Có thực mới vực được đạo.', 'Qua cầu rút ván.', 'Nước đổ lá khoai.', 'Học một biết mười.']
  };
  var paras = {
    family: ['Nhà em có bốn người. Ba làm kỹ sư, mẹ là cô giáo. Em và chị gái đang học tiểu học. Buổi tối, cả nhà cùng ăn cơm và kể chuyện vui.', 'Bà ngoại em sống ở miền quê. Mỗi dịp hè, em về thăm bà. Bà nấu cho em những món ăn ngon. Em rất yêu bà ngoại.'],
    school: ['Trường em có sân rộng và nhiều cây xanh. Giờ ra chơi, chúng em nhảy dây, đá cầu và chơi trốn tìm. Em rất yêu ngôi trường của mình.', 'Cô giáo em tên là Lan. Cô dạy chúng em đọc, viết và làm toán. Cô luôn nhẹ nhàng và kiên nhẫn. Em luôn biết ơn cô giáo.'],
    homeland: ['Quê em có con sông hiền hòa chảy qua cánh đồng lúa. Mùa gặt, cánh đồng vàng rực dưới nắng. Trẻ con chạy nhảy thả diều trên đê. Em yêu quê hương em biết bao.', 'Làng em nằm bên bờ biển xanh. Sáng sớm, ngư dân ra khơi đánh cá. Chiều đến, thuyền về đầy ắp tôm cá. Tiếng cười nói vang lên khắp bến.'],
    tet: ['Tết đến, nhà nhà đều dọn dẹp và trang trí thật đẹp. Em cùng mẹ cắm hoa mai vàng. Đêm giao thừa, cả nhà ngồi xem pháo hoa. Em được ông bà lì xì và chúc năm mới.', 'Mùa xuân về, cây cối đâm chồi nảy lộc. Hoa đào, hoa mai nở rộ khắp nơi. Chim én bay lượn trên bầu trời trong xanh. Ai cũng thấy lòng mình vui tươi.'],
    friends: ['Em có một người bạn thân tên là Minh. Hai đứa em ngồi cùng bàn và hay giúp nhau học bài. Có lần em quên bút, Minh cho em mượn. Em cảm ơn bạn rất nhiều.', 'Chúng em cùng chơi nhảy dây trong giờ ra chơi. Bạn nào ngã, cả nhóm đều chạy đến đỡ dậy. Tình bạn của chúng em thật đẹp.'],
    animals: ['Nhà em nuôi một chú chó tên là Vàng. Vàng rất thông minh và trung thành. Mỗi sáng, Vàng chạy theo em ra cổng trường. Chiều về, Vàng đã đứng chờ em ở đó.', 'Đàn kiến chăm chỉ tha mồi về tổ. Chúng đi thành hàng dài không bao giờ lạc đường. Em học được từ kiến tính siêng năng.'],
    nature: ['Buổi sáng, mặt trời nhô lên sau dãy núi. Ánh nắng vàng chiếu xuống thung lũng xanh mướt. Sương mai long lanh trên những ngọn cỏ. Không khí trong lành làm em thấy khỏe khoắn.', 'Cơn mưa chiều bỗng đổ xuống thật to. Đường phố vắng hẳn đi, chỉ còn tiếng mưa rơi. Một lúc sau, trời tạnh và cầu vồng xuất hiện.', 'Em đi biển cùng gia đình vào dịp hè. Nước biển trong xanh và sóng vỗ rì rào. Em xây lâu đài cát và nhặt vỏ sò. Em ước mùa hè này kéo dài mãi.'],
    habits: ['Mỗi ngày em đọc sách trước khi ngủ. Những câu chuyện hay giúp em mở mang hiểu biết. Em còn học được nhiều điều từ nhân vật trong truyện.', 'Muốn có sức khỏe tốt, em phải ăn uống đủ chất. Mỗi sáng em tập thể dục và uống nhiều nước. Em đi ngủ sớm để mai dậy sớm đến trường.', 'Chúng em cùng nhau giữ gìn trường lớp sạch đẹp. Rác thải được bỏ đúng nơi quy định. Em trồng thêm cây xanh để không khí trong lành hơn.']
  };
  var api = { topics: topics, extra: extra, words2: words2, phrases: phrases, short: short, long: long, givenNames: givenNames, surnames: surnames, places: places, days: days, months: months,
    punct: punct, qa: qa, proverbs: proverbs, cadao: cadao, dongdao: dongdao, idioms: idioms, paras: paras };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.VI = api;
})(typeof window !== 'undefined' ? window : globalThis);
