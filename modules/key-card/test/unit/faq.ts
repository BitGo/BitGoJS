import { generateFaq, generateLightningFaq } from '../../src/faq';

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

describe('generateLightningFaq', function () {
  it('generates base FAQ plus lightning-specific questions', function () {
    const coinName = 'Lightning Bitcoin';
    const questions = generateLightningFaq(coinName);

    questions.length.should.equal(8);

    // Base FAQ coin name interpolation still works
    questions[0].answer[0].should.match(new RegExp(coinName));

    // Lightning-specific question
    questions[7].question.should.equal('What is the User Auth Key?');
    questions[7].answer[2].should.match(new RegExp(coinName));
  });
});
