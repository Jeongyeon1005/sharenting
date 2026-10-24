// 사용자 제공 PDF 및 추가 출처에서 정리한 사례. 날짜 정밀도(연/월/일)를 유지합니다.
// 분야는 요약에 드러난 쟁점을 기준으로 중복 분류합니다.
// privacy: 신체·건강·가족사 등 사적 정보 공개 / crime: 도용·사칭·성착취 등 범죄 악용
// rights: 사용자가 아동 권리 침해 PDF에 분류한 사례만 / footprint: 과거 기록의 잔존·재유포·후속 영향
const archiveCases = [
  {
    "id": "jake",
    "title": "Jake의 아기 사진 입양 사기 도용 사건",
    "date": "2009-08-03",
    "country": "미국",
    "age": "생후 9개월",
    "categories": [
      "privacy",
      "crime",
      "rights"
    ],
    "summary": "어머니가 가족 블로그에 올린 Jake의 사진이 무단 도용되어 온라인 입양 사기 광고에 사용됐다. 광고에는 아이가 고아라는 허위 정보가 붙었다.",
    "sources": [
      "https://abcnews.com/Technology/story?id=8240460"
    ],
    "note": ""
  },
  {
    "id": "darren",
    "title": "자녀 사진 올렸다간 셰어런팅으로 고소당해",
    "date": "2016",
    "country": "캐나다 앨버타주 캘거리시",
    "age": "고소 당시 13세 / 사진은 어린 시절",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "제공 자료는 13세 대런 랜달이 부모가 페이스북에 공유한 어린 시절 사진으로 이미지가 훼손됐다며 약 3억 원을 청구하는 소송을 제기했다고 소개한다.",
    "sources": [
      "https://www.ytn.co.kr/_ln/0103_202207271654529952"
    ],
    "note": "제공 자료에 적힌 연도와 출처의 보도 연도가 다릅니다. 실제 소송 여부와 사건 원출처를 추가로 확인해야 합니다."
  },
  {
    "id": "roman",
    "title": "어머니가 올린 글이 전 세계에 퍼진 11세 소년",
    "date": "2016-11-05",
    "country": "영국",
    "age": "최초 게시 당시 약 10세 / 인터뷰 당시 11세",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "Roman의 어머니 Molly는 2015년 4월 아들이 외로움을 겪는다며 생일 카드를 보내 달라는 글을 페이스북에 올렸다. 글이 약 4만 회 공유되며 카드와 선물이 도착했지만, 아들은 전 세계 사람들이 자신의 외로움을 아는 것이 싫고 이상한 기분이라고 말했다.",
    "sources": [
      "https://www.theguardian.com/lifeandstyle/2016/nov/05/parents-posting-about-kids-share-too-much-online-facebook-paula-cocozza"
    ],
    "note": ""
  },
  {
    "id": "boram",
    "title": "보람튜브 아동 출연 강요 및 아동 권리 침해 논란",
    "date": "2017",
    "country": "대한민국",
    "age": "미상",
    "categories": [
      "rights"
    ],
    "summary": "2017년 세이브더칠드런은 보람튜브 등 아동 출연 채널 운영자를 아동학대 혐의로 고발했다. 아동이 돈을 훔치거나 자동차를 운전하는 상황, 임신·출산을 연기하는 영상 등이 공개돼 논란이 됐다.",
    "sources": [
      "https://www.mk.co.kr/news/society/8910493"
    ],
    "note": ""
  },
  {
    "id": "italy",
    "title": "어머니가 아들의 사생활을 SNS에 반복적으로 공개한 사건",
    "date": "2017-12-23",
    "country": "이탈리아",
    "age": "16세",
    "categories": [
      "privacy",
      "rights",
      "footprint"
    ],
    "summary": "16세 소년은 어머니가 SNS에 사진과 부모의 이혼 분쟁, 가족사 등 사적인 정보를 반복해서 공개하자 법원에 보호를 요청했다. 법원은 기존 게시물을 삭제하고 새로운 사진이나 개인정보를 게시하지 못하도록 명령했으며, 불이행 시 금전 제재를 부과할 수 있도록 했다.",
    "sources": [
      "https://www.courdecassation.fr/decision/679bd25543b3d977d8ccd698"
    ],
    "note": "자료에 첨부된 링크는 프랑스 법원 페이지로, 이탈리아 사건의 출처와 일치하는지 확인이 필요합니다."
  },
  {
    "id": "familyofive",
    "title": "FamilyOFive — 조회수를 위한 장난 콘텐츠와 아동 권리 침해",
    "date": "2018-07-19",
    "country": "미국",
    "age": "미상",
    "categories": [
      "rights"
    ],
    "summary": "부모 마이클 마틴과 헤더 마틴은 자녀들에게 장난을 치고 그 반응을 촬영해 가족 유튜브 채널에 공개했다. 아이들이 울거나 당황하는 모습까지 콘텐츠로 활용하면서 아동학대 논란이 발생했다.",
    "sources": [
      "https://www.theguardian.com/technology/2018/jul/19/youtube-bans-familyofive-pranksters-michael-heather-martin-child-abuse-conviction"
    ],
    "note": "날짜는 자료에 첨부된 기사 URL의 보도일을 기준으로 표기했습니다."
  },
  {
    "id": "estonia",
    "title": "육아 블로그 사진을 ‘성적 거래’ 게시물에 사용",
    "date": "2019",
    "country": "에스토니아",
    "age": "미상",
    "categories": [
      "privacy",
      "crime"
    ],
    "summary": "제공 자료에는 육아 블로그의 자녀 사진을 낯선 사람이 가져가 데이팅 사이트에 게시하고, 아이들을 성적 착취 대상으로 구매할 수 있다는 허위 설명을 붙였다는 피해 진술이 담겨 있다.",
    "sources": [
      "https://www.justice.gov/opa/pr/louisiana-woman-who-provided-child-pornographic-photoshoot-pleads-guilty"
    ],
    "note": "첨부된 링크의 사건명·지역과 자료의 에스토니아 사례 설명이 달라 출처 확인이 필요합니다."
  },
  {
    "id": "bath",
    "title": "2세 딸의 목욕 사진을 게시한 뒤 낯선 사람들의 비난 댓글을 받은 어머니",
    "date": "2019-07",
    "country": "미국",
    "age": "2세",
    "categories": [
      "privacy"
    ],
    "summary": "Katherine Revelle은 두 살 딸이 욕조에서 물감 놀이를 하는 사진을 이미지 공유 사이트에 게시했다. 낯선 이용자들이 사진 공개의 위험을 지적하자 사진을 삭제했지만, 아이의 일상적인 순간이 예상하지 못한 사람들에게까지 전달될 수 있다는 고민이 남았다.",
    "sources": [
      "https://www.washingtonpost.com/lifestyle/2019/07/24/when-did-my-naked-child-become-nude/"
    ],
    "note": ""
  },
  {
    "id": "barnes",
    "title": "아버지가 11세 아동의 사진을 촬영해 온라인에 유포한 사건",
    "date": "2020-03",
    "country": "미국",
    "age": "11세",
    "categories": [
      "privacy",
      "crime"
    ],
    "summary": "도니 반스 시니어는 11세 아동의 성착취 사진을 촬영해 인터넷에 유포하고 다른 아동 성착취물과 교환했다. 아동 성착취물 제작 및 유포 등의 혐의로 징역 15년을 선고받았다.",
    "sources": [
      "https://www.justice.gov/usao-wdwa/pr/spanaway-man-sentenced-15-years-prison-production-and-distribution-images-child"
    ],
    "note": ""
  },
  {
    "id": "grandmother-nl",
    "title": "네덜란드 할머니의 손주 사진 삭제 판결",
    "date": "2020-05-13",
    "country": "네덜란드",
    "age": "14세, 6세, 5세",
    "categories": [
      "privacy",
      "rights"
    ],
    "summary": "할머니가 페이스북과 핀터레스트에 게시한 세 손주의 사진을 어머니의 요청에도 삭제하지 않자 소송이 제기됐다. 법원은 사진 삭제를 명령하고, 계속 게시할 경우 하루 50유로의 제재를 부과할 수 있도록 결정했다.",
    "sources": [
      "https://www.rechtspraak.nl/organisatie-en-contact/organisatie/rechtbanken/rechtbank-gelderland/nieuws/2020/05/vrouw-moet-fotos-kleinkinderen-van-social-media-verwijderen"
    ],
    "note": ""
  },
  {
    "id": "hoodie",
    "title": "“취업하거나 연애할 때도 검색될 것” — 인플루언서 어머니의 콘텐츠에 반대한 자녀",
    "date": "2020-10-11",
    "country": "미국",
    "age": "본인 미상 / 여동생 9세",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "인플루언서 어머니를 둔 청소년은 어린 시절 사진과 정보가 이름 검색에 나타나 향후 취업이나 연애에 영향을 줄 수 있다고 우려했다. 촬영 거부 의사를 표현하기 위해 촬영과 이미지 수익화에 동의하지 않는다는 문구가 적힌 후드티를 자신과 여동생이 입도록 했다.",
    "sources": [
      "https://www.aljazeera.com/features/2020/10/11/facing-the-music-the-parents-who-share-too-much"
    ],
    "note": ""
  },
  {
    "id": "claudia",
    "title": "어머니의 트위터 계정에 게시된 16세 딸의 상반신 노출 사진",
    "date": "2021-01-26",
    "country": "미국",
    "age": "16세",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "켈리앤 콘웨이의 트위터 플릿에 미성년 딸 클라우디아의 상반신 노출 사진이 게시됐다. 사진은 삭제됐지만 캡처가 다른 SNS에 재게시됐다. 클라우디아는 이용자들에게 신고를 요청했고, 경찰은 게시물에 대한 조사가 진행 중이라고 밝혔다.",
    "sources": [
      "https://wpde.com/news/nation-world/kellyanne-conway-accused-of-tweeting-photo-of-her-underage-emancipation-seeking-daughter-01-30-2021"
    ],
    "note": ""
  },
  {
    "id": "momcafe",
    "title": "“엄마가 제 사진을 맘카페에 올려요” — 부모의 게시물에 수치심을 느낀 13세 아동",
    "date": "2021-08-11",
    "country": "대한민국",
    "age": "13세",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "초등학교 6학년이라고 밝힌 아동은 어머니의 블로그에서 공개되기 부끄러운 어린 시절 사진을 발견했다. 어머니가 맘카페와 블로그에 전신 사진뿐 아니라 체중과 사춘기 성격까지 게시했다며, 자신의 사생활도 존중받아야 한다고 호소했다.",
    "sources": [
      "https://view.asiae.co.kr/article/2021081015323570832"
    ],
    "note": ""
  },
  {
    "id": "minois",
    "title": "어머니가 아들의 사진을 화장품 브랜드 광고에 사용한 사건",
    "date": "2021-12",
    "country": "프랑스",
    "age": "사진 게시 당시 약 1~2세",
    "categories": [
      "privacy",
      "rights"
    ],
    "summary": "화장품 브랜드 MINOIS를 운영하던 어머니는 아들의 사진을 브랜드 인스타그램에 게시했다. 촬영과 상업적 이미지 사용에 동의하지 않은 아버지가 항의하며 소송을 제기했다. 자료는 자녀의 온라인 이미지 사용에 사전의 명확한 동의가 필요하다는 법원의 판단을 소개한다.",
    "sources": [
      "https://www.courdecassation.fr/decision/679bd25543b3d977d8ccd698"
    ],
    "note": ""
  },
  {
    "id": "prichard",
    "title": "인스타그램에 공개한 아이 사진의 무단 도용 및 신원 사칭",
    "date": "2022-02",
    "country": "미국",
    "age": "미상",
    "categories": [
      "privacy",
      "crime"
    ],
    "summary": "엄마 인플루언서 케이티 로즈 프리처드는 인스타그램에 공개한 자녀 사진이 낯선 사람들이 만든 가짜 계정에 사용된 사실을 발견했다. 해당 계정들은 사진을 이용해 가상의 이름과 신분, 이야기를 만들어 운영했다.",
    "sources": [
      "https://abcnews.com/GMA/Family/mom-influencer-opens-erased-kids-faces-social-media/story?id=82928115"
    ],
    "note": ""
  },
  {
    "id": "actor",
    "title": "배우 A씨의 아들 나체 사진 게시 논란",
    "date": "",
    "country": "자료에 미기재",
    "age": "5세",
    "categories": [
      "privacy"
    ],
    "summary": "배우 A씨가 인스타그램에 여행 중 옷을 입지 않은 아들의 뒷모습 사진을 게시했다. 팬들은 아이가 성장한 뒤 불쾌감을 느낄 수 있다며 삭제하거나 신체 노출 부분을 가려 달라고 요청했다. 비판이 이어지자 A씨는 사진을 삭제했다.",
    "sources": [
      "https://www.mt.co.kr/politics/2022/09/02/2022090109597881816"
    ],
    "note": "자료에 날짜·국가가 별도로 기재되지 않아 날짜 미상으로 분류했습니다. 출처 URL에는 2022년 9월 2일이 포함되어 있습니다."
  },
  {
    "id": "vlog",
    "title": "가족 브이로그 속에서 자란 청소년의 사생활 침해",
    "date": "2022-09",
    "country": "호주(제공 자료 기준)",
    "age": "미상",
    "categories": [
      "privacy",
      "rights",
      "footprint"
    ],
    "summary": "틱톡 크리에이터 캐럴라인 이섬은 가족 브이로그에 출연하며 성장한 청소년의 익명 편지를 소개했다. 작성자는 부모가 어린 시절과 일상을 온라인 콘텐츠로 공개하며 겪었던 문제와 사생활 보호의 필요성을 이야기했다.",
    "sources": [
      "https://nhseb.org/case-library/sharenting"
    ],
    "note": "국가는 제공 자료의 표기를 유지했습니다. 익명 편지 작성자의 실제 거주 국가인지는 확인이 필요합니다."
  },
  {
    "id": "steele",
    "title": "Meredith Steele 가족사진 도용 및 ‘디지털 납치’",
    "date": "2022-12-15",
    "country": "미국",
    "age": "9세, 11세",
    "categories": [
      "privacy",
      "crime"
    ],
    "summary": "Meredith Steele이 가족사진을 식당 위치와 함께 인스타그램에 올린 뒤, 낯선 사람이 사진을 복제해 가짜 가족 계정을 만들었다. 계정은 가족사진 30장 이상과 학교 등하교·외출 정보를 실제 일상처럼 꾸며 공개했다. Steele은 이후 자녀 얼굴 사진을 삭제하고 실시간 위치도 공개하지 않기로 했다.",
    "sources": [
      "https://www.the-independent.com/life-style/health-and-families/online-child-safety-instagram-digital-kidnapping-b2244940.html"
    ],
    "note": ""
  },
  {
    "id": "jurik",
    "title": "Stacey Jurik의 자녀 인스타그램 계정 사건",
    "date": "2023",
    "country": "미국",
    "age": "8세",
    "categories": [
      "privacy",
      "crime",
      "rights"
    ],
    "summary": "어머니가 운영하던 아이의 인스타그램 계정을 통해 사진가 Grant Durtschi와 접촉했고, 이후 아이를 성적 촬영에 참여시켰다. 제공 자료에 따르면 2023년 어머니에게 징역 32년이 선고됐다.",
    "sources": [
      "https://collincountyda.com/wylie-woman-sentenced-to-32-years-without-parole-in-child-exploitation-pornography-case/"
    ],
    "note": ""
  },
  {
    "id": "bella",
    "title": "만성질환을 앓는 딸의 의료정보를 대규모 팔로워에게 공개한 어머니",
    "date": "2023-05-11",
    "country": "캐나다",
    "age": "보도 당시 9세",
    "categories": [
      "privacy"
    ],
    "summary": "카일라 톰슨은 희귀질환을 앓는 딸 벨라의 일상을 블로그와 SNS에 공유해 왔다. 틱톡 팔로워는 570만 명에 달했으며, 게시물에는 입원과 구급차 이용, 야간 정맥주사 등 구체적인 의료정보가 포함됐다.",
    "sources": [
      "https://www.washingtonpost.com/parenting/2023/05/11/tiktok-medical-mamas/"
    ],
    "note": ""
  },
  {
    "id": "cam",
    "title": "Cam Barrett — 초경·사고·병원 사진과 어린 시절 사진의 지속적 노출",
    "date": "2023-07-06",
    "country": "미국",
    "age": "메시지 수신 당시 12세 / 각 게시물 공개 당시 미상",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "Cam Barrett는 어머니가 초경 정보, 사고 뒤 병원에 누워 있는 모습, 어린 시절 수영복 사진과 일상을 SNS에 공개했다고 증언했다. 모르는 사람도 자신의 초경 사실을 알고 있었고, 12세 때에는 낯선 남성에게 집까지 따라갔다는 메시지를 받았다고 밝혔다. 성인이 된 뒤에도 이름을 검색하면 어린 시절 사진이 나타나며 불안을 느낀다고 말했다. 각 게시물이 공개됐을 당시의 나이는 명시되지 않았다. 당사자 인터뷰에 근거한 피해 증언이다.",
    "sources": [
      "https://abcnews.com/US/social-media-posts-parents-bring-concerns-childrens-privacy/story?id=100706825"
    ],
    "note": "정렬 날짜는 연결된 ABC News 기사의 2023년 7월 6일 보도일입니다. 해당 기사에서 인터뷰 당시 나이는 24세로 확인됩니다. 제공된 2023~2024년 인터뷰 설명 중 2024년·25세 정보의 별도 출처는 첨부되지 않았습니다."
  },
  {
    "id": "kasket",
    "title": "부모가 7년간 올린 이야기를 아이가 직접 삭제해 달라고 요구한 사례",
    "date": "2023-08-30",
    "country": "영국",
    "age": "당시 9세",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "심리학자 Elaine Kasket은 딸과의 대화와 일상을 7년간 꾸준히 게시했다. 딸은 원하지 않는 이야기가 공개되고 낯선 사람들이 자신을 이미 아는 것처럼 대하는 상황이 불편했다고 털어놓았다. 어머니는 요청에 따라 기존 게시물을 삭제하고 게시를 중단했으며, 이후 관계의 신뢰가 회복됐다고 밝혔다.",
    "sources": [
      "https://www.theguardian.com/lifeandstyle/2023/aug/30/a-moment-that-changed-me-i-stopped-posting-funny-stories-about-my-daughter-and-she-began-to-trust-me-again"
    ],
    "note": ""
  },
  {
    "id": "indiana",
    "title": "생후 18개월 자녀를 성적으로 학대하고 영상·사진을 제작한 부모",
    "date": "2023-12",
    "country": "미국 인디애나주",
    "age": "생후 약 18개월",
    "categories": [
      "privacy",
      "crime",
      "rights"
    ],
    "summary": "트리스탄 멀린스와 데슬리 맥레모어는 자녀를 학대하고 관련 이미지와 영상 98개 이상을 제작한 혐의에 대해 유죄를 인정했다. 자료는 아버지가 여러 SNS와 웹사이트를 통해 자료를 공유했으며, 부모가 각각 징역 60년과 30년을 선고받았다고 설명한다.",
    "sources": [
      "https://www.justice.gov/usao-sdin/pr/parents-sentenced-combined-90-years-federal-prison-sexually-abusing-and-exploiting"
    ],
    "note": "두 PDF의 날짜가 2023년 12월 8일과 12일로 달라, 공통으로 확인되는 연·월만 표기했습니다."
  },
  {
    "id": "colombia",
    "title": "콜롬비아 메데인의 어머니 사건",
    "date": "2024",
    "country": "콜롬비아 / 미국 연계",
    "age": "1세",
    "categories": [
      "privacy",
      "crime"
    ],
    "summary": "제공 자료는 어머니가 아이의 성착취 사진을 촬영해 SNS로 유포하고, 미국 경찰관 Angad Beharry와 페이스북으로 연락했으며 그가 관련 자료를 요구했다고 진술한 사건을 소개한다.",
    "sources": [
      "https://www.justice.gov/usao-sdny/pr/us-attorney-charges-nypd-officer-sexual-exploitation-minor-and-possession-child"
    ],
    "note": "자료의 2024년 발표를 정렬 기준으로 사용했습니다. 체포 연도는 2022년으로 기재되어 있습니다."
  },
  {
    "id": "brisbane",
    "title": "어린 자녀 사진을 WhatsApp에서 교환한 아버지",
    "date": "2024",
    "country": "호주 브리즈번",
    "age": "친아들 3세 / 동거인의 딸 1세",
    "categories": [
      "privacy",
      "crime"
    ],
    "summary": "아버지가 두 아이의 성착취 사진을 직접 촬영해 WhatsApp으로 전송하고 다른 아동 성착취물을 받은 사건이다.",
    "sources": [
      "https://www.couriermail.com.au/questnews/southeast/convicted-child-sex-offender-dad-in-brisbane-court-for-trading-explicit-pics-of-his-own-toddlers/news-story/2fbfb59c7070f7b32f0374d2a3f86fb4"
    ],
    "note": ""
  },
  {
    "id": "grandmother-au",
    "title": "손녀에 대한 아동 학대물을 촬영해 틱톡에 게시한 할머니",
    "date": "2024-04-30",
    "country": "호주",
    "age": "미상",
    "categories": [
      "privacy",
      "crime",
      "rights"
    ],
    "summary": "캔버라의 여성이 손녀가 등장하는 아동 학대물에 해당하는 영상을 촬영해 틱톡에 비공개로 게시했다. 아이의 어머니는 삭제를 요구했지만 영상은 남아 있었고 플랫폼이 이를 신고했다. 법원은 특수성을 고려해 유죄 판결을 기록하지 않고 두 건의 범죄에 각각 1년간의 선행보증 명령을 내렸다.",
    "sources": [
      "https://www.abc.net.au/news/2024-04-30/act-grandmother-filming-child-abuse-material-tiktok-post/103786002"
    ],
    "note": ""
  },
  {
    "id": "kaylin",
    "title": "Kaylin Hayman의 인스타그램 사진을 이용한 AI 성착취 이미지 제작",
    "date": "2024-10",
    "country": "미국",
    "age": "사진 게시 당시 12세",
    "categories": [
      "privacy",
      "crime"
    ],
    "summary": "아역 배우 Kaylin Hayman의 인스타그램 사진을 57세 남성이 내려받아 AI로 성적 이미지를 제작했다. 피해자는 법정에서 증언했고, 가해자는 아동 성착취물 관련 혐의로 유죄 판결을 받았다.",
    "sources": [
      "https://www.theguardian.com/technology/ng-interactive/2024/oct/26/ai-child-sexual-abuse-images-kaylin-hayman"
    ],
    "note": ""
  },
  {
    "id": "grok",
    "title": "어린 시절 사진을 이용한 AI 성착취 이미지 제작 및 유포",
    "date": "2026-08-15",
    "country": "자료에 미기재",
    "age": "사진 촬영 당시 약 11세",
    "categories": [
      "privacy",
      "crime",
      "footprint"
    ],
    "summary": "워싱턴포스트는 법원 서류에서 Jane Doe 4로 익명 처리된 여성의 주장을 보도했다. 피해자는 어린 시절 사진이 AI 도구 Grok으로 성적으로 노골적인 허위 이미지로 변형됐으며, 계부가 7,000장 이상을 제작해 온라인에 유통했다고 주장했다.",
    "sources": [
      "https://www.washingtonpost.com/technology/2026/08/15/woman-alleges-grok-made-thousands-sexual-abuse-images-childhood-snap/"
    ],
    "note": ""
  },
  {
    "id": "claire",
    "title": "가족 생계를 위해 촬영을 계속해야 한다는 압박",
    "date": "",
    "country": "미국",
    "age": "미상",
    "categories": [
      "privacy",
      "footprint"
    ],
    "summary": "가족 채널의 수익이 늘자 부모가 직장을 그만뒀다. Claire는 촬영을 그만두고 싶다고 하자 아버지가 집을 옮기고 부모가 다시 일해야 한다고 말했다고 전했다. 아버지가 자신을 부모이자 고용주로 대하는 데 부담을 느꼈으며, 이름을 검색하면 성장 기록이 나오고 밖에서도 사람들이 알아봤다고 밝혔다. 성인이 되면 부모와 연락을 끊는 것도 고려한다고 말했다.",
    "sources": [
      "https://www.teenvogue.com/story/influencer-parents-children-social-media-impact"
    ],
    "note": "제공 자료에 날짜가 기재되지 않아 날짜 미상으로 분류했습니다."
  },
  {
    "id": "jordan-cheyenne",
    "title": "Jordan Cheyenne의 아들 — 썸네일을 위한 울음 연출 요구",
    "date": "2021-09-08",
    "country": "미국",
    "age": "9세",
    "categories": [
      "footprint"
    ],
    "summary": "Jordan Cheyenne은 반려견이 파보바이러스에 감염됐다는 내용의 영상을 게시했다. 영상 끝에는 아들에게 썸네일용 자세와 우는 표정을 요구하는 편집 전 장면이 남아 있었고, 아들은 이미 울고 있다고 반응했다. 영상이 비판과 함께 확산되자 어머니는 사과했다. 원본 영상과 계정이 삭제된 뒤에도 장면은 재공유됐다. 아이의 감정을 콘텐츠 제작에 이용한 사례이며, 인용 자료는 형사처벌을 보고하지 않는다.",
    "sources": [
      "https://mediaengagement.org/wp-content/uploads/2022/01/123-The-Ethics-of-Family-YouTubers-Case-Study.pdf"
    ],
    "note": ""
  },
  {
    "id": "korean-study-14",
    "title": "온라인 사진을 보고 현실에서 아이를 알아본 낯선 사람 — 국내 연구 참여자 #14",
    "date": "2023-06-30",
    "country": "대한민국",
    "age": "미상",
    "categories": [
      "privacy"
    ],
    "summary": "어머니 16명을 인터뷰한 국내 연구에서 참여자 #14는 지인도 팔로워도 아닌 사람이 자신의 피드를 보고 아이의 옷차림을 기억하며 알아봤다고 진술했다. 공개된 아이의 얼굴·옷차림·일상 사진이 현실 공간에서 아이를 식별하는 단서가 된 사례다. 범죄 발생 사례가 아니라 연구 참여자의 경험 진술이다.",
    "sources": [
      "https://kjhe.or.kr/_PR/view/?aidx=37019&bidx=3338"
    ],
    "note": "날짜는 연구의 발행일입니다. 아이의 정확한 나이는 공개되지 않았습니다."
  },
  {
    "id": "kodye-elyse",
    "title": "Kodye Elyse의 딸 — 영상 삭제 후에도 학교 주소 유출과 협박",
    "date": "2023-07-06",
    "country": "미국",
    "age": "화제가 된 영상 속 딸 5세",
    "categories": [
      "privacy",
      "crime",
      "footprint"
    ],
    "summary": "Kodye Elyse가 다섯 살 딸과 역할을 바꾸는 영상을 올린 뒤 아이를 향한 부적절한 댓글이 달렸다. 어머니는 자녀들의 영상과 사진을 삭제했지만, 이후 학교 주소가 유출되고 가족이 살해 협박을 받았다고 밝혔다. 얼굴과 가족관계가 공개된 뒤에도 피해가 이어졌다는 당사자의 경험 진술이다. 학교 주소가 어떤 게시물에서 확보됐는지는 기사에서 확인되지 않는다.",
    "sources": [
      "https://abcnews.com/US/social-media-posts-parents-bring-concerns-childrens-privacy/story?id=100706825"
    ],
    "note": "날짜는 보도일입니다. 학교 주소의 확보 경로는 확인되지 않아 특정 게시물과의 인과관계를 단정하지 않습니다."
  }
];
