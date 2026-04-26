#!/usr/bin/env bash
# E2E テストシナリオ
# 前提: API (port 8787)、PostgreSQL (port 5433) が起動済み
set -u

API="${API_BASE:-http://localhost:8787}"
PASS=0
FAIL=0

assert() {
  if [ "$2" = "$3" ]; then
    echo "  ✓ $1"
    PASS=$((PASS+1))
  else
    echo "  ✗ $1 (got '$2', expected '$3')"
    FAIL=$((FAIL+1))
  fi
}

reset_db() {
  docker compose exec -T postgres psql -U app -d surechigai \
    -c "TRUNCATE users, encounters, agreements, silent_rejects, reports CASCADE" >/dev/null 2>&1
}

create_user() {
  local nick="$1" sum="$2" det="$3"
  curl -s -X POST "$API/api/users" -H 'Content-Type: application/json' \
    -d "{\"nickname\":\"$nick\",\"profileSummary\":\"$sum\",\"profileDetail\":\"$det\"}" \
    | python -c "import sys,json;print(json.load(sys.stdin).get('id',''))"
}

set_home() {
  local id="$1" lat="$2" lng="$3"
  curl -s -X PATCH "$API/api/users/me/home" -H "X-User-Id: $id" -H 'Content-Type: application/json' \
    -d "{\"lat\":$lat,\"lng\":$lng}" >/dev/null
}

encounter() {
  local id="$1" lat="$2" lng="$3" other="$4"
  curl -s -X POST "$API/api/encounters" -H "X-User-Id: $id" -H 'Content-Type: application/json' \
    -d "{\"lat\":$lat,\"lng\":$lng,\"otherUserIds\":[\"$other\"]}"
}

list_encounters() {
  curl -s -H "X-User-Id: $1" "$API/api/encounters"
}

agree() {
  curl -s -X POST "$API/api/agreements/$2/agree" -H "X-User-Id: $1" -H 'Content-Type: application/json' -d '{}'
}

reject() {
  curl -s -X POST "$API/api/silent-rejects" -H "X-User-Id: $1" -H 'Content-Type: application/json' \
    -d "{\"rejectedId\":\"$2\"}" >/dev/null
}

set_yesterday() {
  docker compose exec -T postgres psql -U app -d surechigai \
    -c "UPDATE encounters SET last_counted_date = CURRENT_DATE - INTERVAL '1 day';" >/dev/null 2>&1
}

reset_db
echo "DB cleaned"

ALICE=$(create_user "qa_alice" "summary_a" "detail_a")
BOB=$(create_user "qa_bob" "summary_b" "detail_b")
set_home "$ALICE" 33.6 130.5
set_home "$BOB" 34.0 131.0

echo
echo "=== Test 1: 同日丸め ==="
COUNT1=$(encounter "$ALICE" 35.0 135.0 "$BOB" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['count'])")
COUNT2=$(encounter "$ALICE" 35.0 135.0 "$BOB" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['count'])")
assert "1回目=1" "$COUNT1" "1"
assert "同日2回目=1（丸め）" "$COUNT2" "1"

echo
echo "=== Test 2: 日跨ぎカウントアップ ==="
set_yesterday
COUNT3=$(encounter "$ALICE" 35.0 135.0 "$BOB" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['count'])")
assert "翌日扱い=2" "$COUNT3" "2"

echo
echo "=== Test 3: 3回目で Lv.2 解禁 ==="
set_yesterday
COUNT4=$(encounter "$ALICE" 35.0 135.0 "$BOB" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['count'])")
LIST=$(list_encounters "$ALICE")
STAGE=$(echo "$LIST" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['partner']['stage'])")
NICK=$(echo "$LIST" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['partner'].get('nickname',''))")
DETAIL_LV2=$(echo "$LIST" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['partner'].get('profileDetail',''))")
ENC_ID=$(echo "$LIST" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['encounterId'])")
assert "count=3" "$COUNT4" "3"
assert "stage=Lv2" "$STAGE" "Lv2"
assert "Lv.2 で nickname 開示" "$NICK" "qa_bob"
assert "Lv.2 で profileDetail 未開示" "$DETAIL_LV2" ""

echo
echo "=== Test 4: 双方合意で Lv.3 ==="
agree "$ALICE" "$ENC_ID" >/dev/null
RES_AGREE=$(agree "$BOB" "$ENC_ID")
UNLOCKED=$(echo "$RES_AGREE" | python -c "import sys,json;d=json.load(sys.stdin);print('SET' if d.get('unlockedAt') else 'null')")
LIST_LV3=$(list_encounters "$ALICE")
STAGE_LV3=$(echo "$LIST_LV3" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['partner']['stage'])")
DETAIL_LV3=$(echo "$LIST_LV3" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['partner'].get('profileDetail',''))")
assert "unlocked_at セット" "$UNLOCKED" "SET"
assert "stage=Lv3" "$STAGE_LV3" "Lv3"
assert "Lv.3 で profileDetail 開示" "$DETAIL_LV3" "detail_b"

echo
echo "=== Test 5: 自宅圏内すれ違いはスキップ ==="
SKIPPED=$(encounter "$ALICE" 33.601 130.501 "$BOB" | python -c "import sys,json;print(json.load(sys.stdin).get('skipped',False))")
assert "自宅100m → スキップ" "$SKIPPED" "True"

echo
echo "=== Test 6: 期限切れ ==="
docker compose exec -T postgres psql -U app -d surechigai -c "TRUNCATE encounters, agreements CASCADE" >/dev/null 2>&1
encounter "$ALICE" 35.0 135.0 "$BOB" >/dev/null
set_yesterday
encounter "$ALICE" 35.0 135.0 "$BOB" >/dev/null
set_yesterday
encounter "$ALICE" 35.0 135.0 "$BOB" >/dev/null
LIST_AGR=$(list_encounters "$ALICE")
ENC2=$(echo "$LIST_AGR" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['encounterId'])")
agree "$ALICE" "$ENC2" >/dev/null
set_yesterday
RES_E=$(encounter "$ALICE" 35.0 135.0 "$BOB")
EXPIRED=$(echo "$RES_E" | python -c "import sys,json;print(json.load(sys.stdin)['encounters'][0]['expired'])")
assert "4回目で合意期限切れ" "$EXPIRED" "True"

RES_AFTER=$(agree "$BOB" "$ENC2")
ERR=$(echo "$RES_AFTER" | python -c "import sys,json;print(json.load(sys.stdin).get('error',''))")
assert "期限切れ後の合意拒否" "$ERR" "agreement window expired"

echo
echo "=== Test 7: サイレントリジェクト ==="
CAROL=$(create_user "qa_carol" "" "")
encounter "$ALICE" 35.0 135.0 "$CAROL" >/dev/null
B=$(list_encounters "$ALICE" | python -c "import sys,json;print(len(json.load(sys.stdin)['encounters']))")
reject "$ALICE" "$CAROL"
A=$(list_encounters "$ALICE" | python -c "import sys,json;print(len(json.load(sys.stdin)['encounters']))")
assert "リジェクト前=2" "$B" "2"
assert "リジェクト後=1" "$A" "1"

echo
echo "================================="
echo "PASS: $PASS / FAIL: $FAIL"
echo "================================="
exit $FAIL
