const { transpile } = require('./index')

const src = `
import { SurveyBot, Message } from 'https://raw.githubusercontent.com/TradaTech/icetea/master/icetea/bot/index.js'
import * as helper from 'https://raw.githubusercontent.com/TradaTech/icetea/master/example/astrobot/helper.js'

@contract class AstroBot extends SurveyBot {

    @pure getName() {
        return 'Thầy Măng Cụt'
    }

    @pure getDescription() {
        return 'Thầy Măng Cụt biết nhiều thứ, nhưng ông chỉ nói đủ.'
    }

    @pure getSteps() {
        return ['Boarding', 'Terms', 'Name', 'Gender', 'Dob', 'Hour']
    }

    succeedBoarding() {
        return Message.html('Kính chào quý khách. Tôi là <i>Thầy Măng Cụt</i>,' + 
            ' chuyên hành nghề bói Tử Vi trên Icetea blockchain.', 'html')
            .text('Nếu bạn muốn xem thì bấm nút phía dưới. Không muốn thì thôi.')
            .button('Tôi là người Việt và sinh ở Việt Nam', 'start')
            .done()
    }

    succeedTerms() {
        return Message.text('Tốt quá. Vì tôi không biết xem cho người nước ngoài hoặc sinh ở nước ngoài.')
            .text('Đầu tiên, hãy cho biết tên (bao gồm cả tên lót nếu nó là riêng của bạn)')
            .input('Ngọc Trinh')
            .done()
    }

    collectName(name, collector) {
        collector.name = helper.toTitleCase(name)
        return collector.name
    }
}
`

// transpile(src, { minify: true }).then(console.log)
transpile(src, { prettier: true }).then(console.log)