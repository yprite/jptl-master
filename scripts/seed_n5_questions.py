#!/usr/bin/env python3
"""
N5 문제 샘플 데이터 생성 스크립트
데이터베이스에 JLPT N5 레벨의 샘플 문제를 삽입합니다.
"""

import sys
import os

# 프로젝트 루트를 Python 경로에 추가
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.domain.entities.question import Question
from backend.domain.value_objects.jlpt import JLPTLevel, QuestionType
from backend.infrastructure.repositories.question_repository import SqliteQuestionRepository
from backend.infrastructure.config.database import get_database


def create_n5_sample_questions():
    """N5 레벨 샘플 문제 생성"""
    
    questions = [
        # 어휘 문제
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「こんにちは」の意味は何ですか？",
            choices=["안녕하세요", "감사합니다", "실례합니다", "죄송합니다"],
            correct_answer="안녕하세요",
            explanation="「こんにちは」は日本語で「안녕하세요」という意味です。昼間の挨拶として使われます。",
            difficulty=1
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「ありがとう」の意味は何ですか？",
            choices=["안녕하세요", "감사합니다", "실례합니다", "죄송합니다"],
            correct_answer="감사합니다",
            explanation="「ありがとう」は日本語で「감사합니다」という意味です。感謝を表す言葉です。",
            difficulty=1
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「本」の読み方は何ですか？",
            choices=["ほん", "はん", "ほ", "は"],
            correct_answer="ほん",
            explanation="「本」は「ほん」と読みます。書籍を意味します。",
            difficulty=1
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「水」の読み方は何ですか？",
            choices=["みず", "みつ", "すい", "す"],
            correct_answer="みず",
            explanation="「水」は「みず」と読みます。液体の水を意味します。",
            difficulty=1
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「食べる」の意味は何ですか？",
            choices=["마시다", "먹다", "자다", "보다"],
            correct_answer="먹다",
            explanation="「食べる」は「먹다」という意味です。食事をする動作を表します。",
            difficulty=1
        ),
        
        # 문법 문제
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.GRAMMAR,
            question_text="これは___です。",
            choices=["本", "本を", "本に", "本が"],
            correct_answer="本",
            explanation="「これは本です」は「これは本です」という意味です。「は」は主題を表す助詞です。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.GRAMMAR,
            question_text="私はコーヒー___飲みます。",
            choices=["を", "が", "に", "で"],
            correct_answer="を",
            explanation="「を」は目的語を表す助詞です。「コーヒーを飲みます」は「커피를 마십니다」という意味です。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.GRAMMAR,
            question_text="学校___行きます。",
            choices=["を", "が", "に", "で"],
            correct_answer="に",
            explanation="「に」は方向や目的地を表す助詞です。「学校に行きます」は「학교에 갑니다」という意味です。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.GRAMMAR,
            question_text="毎日日本語___勉強します。",
            choices=["を", "が", "に", "で"],
            correct_answer="を",
            explanation="「を」は目的語を表す助詞です。「日本語を勉強します」は「일본어를 공부합니다」という意味です。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.GRAMMAR,
            question_text="昨日、映画___見ました。",
            choices=["を", "が", "に", "で"],
            correct_answer="を",
            explanation="「を」は目的語を表す助詞です。「映画を見ました」は「영화를 봤습니다」という意味です。",
            difficulty=2
        ),
        
        # 독해 문제
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.READING,
            question_text="田中さんは学生です。毎日学校に行きます。\n\n田中さんは何をしますか？",
            choices=["仕事をします", "学校に行きます", "旅行をします", "買い物をします"],
            correct_answer="学校に行きます",
            explanation="本文によると、田中さんは学生で、毎日学校に行きます。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.READING,
            question_text="今日は日曜日です。私は図書館で本を読みます。\n\n筆者はどこで本を読みますか？",
            choices=["学校", "図書館", "家", "公園"],
            correct_answer="図書館",
            explanation="本文によると、筆者は図書館で本を読みます。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.READING,
            question_text="私は毎朝7時に起きます。それから、朝ごはんを食べます。\n\n筆者は何時に起きますか？",
            choices=["6時", "7時", "8時", "9時"],
            correct_answer="7時",
            explanation="本文によると、筆者は毎朝7時に起きます。",
            difficulty=1
        ),
        
        # 청해 문제 (텍스트로 표현)
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.LISTENING,
            question_text="（会話）\nA: おはようございます。\nB: おはようございます。今日はいい天気ですね。\nA: はい、そうですね。\n\nBさんは何について話していますか？",
            choices=["時間", "天気", "食べ物", "仕事"],
            correct_answer="天気",
            explanation="Bさんは「今日はいい天気ですね」と言っています。天気について話しています。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.LISTENING,
            question_text="（会話）\nA: すみません、これはいくらですか？\nB: 500円です。\nA: じゃあ、これをください。\n\nAさんは何をしますか？",
            choices=["質問します", "買います", "返します", "借ります"],
            correct_answer="買います",
            explanation="Aさんは「これをください」と言っています。これは「これを買います」という意味です。",
            difficulty=2
        ),
        
        # 추가 어휘 문제
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「学校」の読み方は何ですか？",
            choices=["がっこう", "がくこう", "がっこ", "がくこ"],
            correct_answer="がっこう",
            explanation="「学校」は「がっこう」と読みます。教育機関を意味します。",
            difficulty=1
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「友達」の読み方は何ですか？",
            choices=["ともだち", "とんだち", "ともたち", "とんたち"],
            correct_answer="ともだち",
            explanation="「友達」は「ともだち」と読みます。친구를 의미합니다。",
            difficulty=1
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.VOCABULARY,
            question_text="「見る」の意味は何ですか？",
            choices=["듣다", "보다", "읽다", "쓰다"],
            correct_answer="보다",
            explanation="「見る」は「보다」という意味です。視覚で何かを認識する動作を表します。",
            difficulty=1
        ),
        
        # 추가 문법 문제
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.GRAMMAR,
            question_text="私は毎日6時___起きます。",
            choices=["を", "が", "に", "で"],
            correct_answer="に",
            explanation="「に」は時間を表す助詞です。「6時に起きます」は「6시에 일어납니다」という意味です。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.GRAMMAR,
            question_text="電車___会社に行きます。",
            choices=["を", "が", "に", "で"],
            correct_answer="で",
            explanation="「で」は手段や方法を表す助詞です。「電車で行きます」は「전철로 갑니다」という意味です。",
            difficulty=2
        ),
        
        # 추가 독해 문제
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.READING,
            question_text="私は毎日図書館で勉強します。図書館は静かで、集中できます。\n\n筆者はなぜ図書館で勉強しますか？",
            choices=["本が多いから", "静かで集中できるから", "友達がいるから", "近いから"],
            correct_answer="静かで集中できるから",
            explanation="本文によると、図書館は静かで、集中できるので、筆者は図書館で勉強します。",
            difficulty=2
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.READING,
            question_text="今日は土曜日です。私は公園で散歩をします。天気がいいです。\n\n筆者はどこで散歩をしますか？",
            choices=["学校", "図書館", "公園", "家"],
            correct_answer="公園",
            explanation="本文によると、筆者は公園で散歩をします。",
            difficulty=1
        ),
        
        # 추가 청해 문제
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.LISTENING,
            question_text="（会話）\nA: 今何時ですか？\nB: 3時です。\nA: ありがとうございます。\n\n今何時ですか？",
            choices=["2時", "3時", "4時", "5時"],
            correct_answer="3時",
            explanation="Bさんは「3時です」と言っています。",
            difficulty=1
        ),
        Question(
            id=0,
            level=JLPTLevel.N5,
            question_type=QuestionType.LISTENING,
            question_text="（会話）\nA: どこへ行きますか？\nB: 図書館へ行きます。\nA: 一緒に行きましょう。\n\nBさんはどこへ行きますか？",
            choices=["学校", "図書館", "公園", "家"],
            correct_answer="図書館",
            explanation="Bさんは「図書館へ行きます」と言っています。",
            difficulty=1
        ),
    ]
    
    return questions


def seed_database():
    """데이터베이스에 샘플 문제 삽입"""
    db = get_database()
    repo = SqliteQuestionRepository(db)
    
    # 기존 N5 문제 확인
    existing_questions = repo.find_by_level(JLPTLevel.N5)
    if existing_questions:
        print(f"이미 {len(existing_questions)}개의 N5 문제가 존재합니다.")
        response = input("기존 문제를 삭제하고 새로 추가하시겠습니까? (y/n): ")
        if response.lower() == 'y':
            for q in existing_questions:
                repo.delete(q)
            print("기존 문제를 삭제했습니다.")
        else:
            print("샘플 데이터 추가를 취소했습니다.")
            return
    
    # 샘플 문제 생성
    questions = create_n5_sample_questions()
    
    # 데이터베이스에 저장
    print(f"{len(questions)}개의 N5 샘플 문제를 추가합니다...")
    for i, question in enumerate(questions, 1):
        saved_question = repo.save(question)
        print(f"[{i}/{len(questions)}] 문제 추가 완료: {saved_question.question_text[:30]}...")
    
    print(f"\n✅ 총 {len(questions)}개의 N5 샘플 문제가 추가되었습니다.")
    
    # 유형별 통계
    type_counts = {}
    for q in questions:
        q_type = q.question_type.value
        type_counts[q_type] = type_counts.get(q_type, 0) + 1
    
    print("\n유형별 문제 수:")
    for q_type, count in type_counts.items():
        print(f"  - {q_type}: {count}개")


if __name__ == "__main__":
    try:
        seed_database()
    except Exception as e:
        print(f"❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

