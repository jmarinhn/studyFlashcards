import test from 'node:test';
import assert from 'node:assert/strict';
import { newGuide, validateGuide, guideToStudyDeck } from '../src/community/deckModel.js';
test('editor validates multiple answers, strips blank options and preserves explanations',()=>{
 const guide=newGuide();guide.title=' Mi guía ';guide.questions[0].question='¿Cuáles?';guide.questions[0].options[0].text='Una';guide.questions[0].options[1].text='Otra';guide.questions[0].answer_official='BAA';guide.questions[0].explanation='Ambas';
 const valid=validateGuide(guide);assert.equal(valid.title,'Mi guía');assert.equal(valid.questions[0].answer_official,'AB');assert.equal(valid.questions[0].options.length,2);
 assert.throws(()=>validateGuide({...guide,title:''}),/título/);
 assert.throws(()=>validateGuide({...guide,questions:[]}),/200/);
 assert.throws(()=>validateGuide({...guide,questions:[{...guide.questions[0],answer_official:'C'}]}),/Pregunta 1/);
 const study=guideToStudyDeck({...valid,id:'example',questions:[{...valid.questions[0],answer_community:'B'}]});assert.equal(study.questions[0].answer_community,'B');assert.equal(study.communityId,'example');
 assert.equal(guideToStudyDeck({...valid,id:'example'}).questions[0].answer_community,'AB');
});
