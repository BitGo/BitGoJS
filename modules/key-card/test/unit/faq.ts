import { generateFaq } from '../../src/faq';

describe('generateFaq', function () {
  it('generates faq with filled in coin name', function () {
    const coinName = 'fooCoin';
    const questions = generateFaq(coinName);

    questions.length.should.equal(7);
    questions[0].answer[0].should.match(new RegExp(coinName));
    questions[2].answer[0].should.match(new RegExp(coinName));
    questions[5].answer[1].should.match(new RegExp(coinName));
    questions[6].answer[2].should.match(new RegExp(coinName));
  });
});
