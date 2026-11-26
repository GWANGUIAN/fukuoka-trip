// RFC 8291 부록 A 테스트 벡터로 encryptPayload 검증: node scripts/test-webpush.mjs
import { encryptPayload, b64urlDecode, b64urlEncode } from '../src/webpush.ts';

const V = {
  plaintext: 'V2hlbiBJIGdyb3cgdXAsIEkgd2FudCB0byBiZSBhIHdhdGVybWVsb24',
  asPublic: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  asPrivate: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  uaPublic: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  uaPrivate: 'q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94',
  salt: 'DGv6ra1nlYgDCS1FRnbzlw',
  auth: 'BTBZMqHH6r4Tts7J_aSIgg',
  result:
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
};

const pub = b64urlDecode(V.asPublic);
const jwk = { kty: 'EC', crv: 'P-256', d: V.asPrivate, x: b64urlEncode(pub.slice(1, 33)), y: b64urlEncode(pub.slice(33, 65)) };
const out = await encryptPayload(
  { endpoint: 'https://example.com', keys: { p256dh: V.uaPublic, auth: V.auth } },
  b64urlDecode(V.plaintext),
  { salt: b64urlDecode(V.salt), serverKeys: { publicRaw: pub, privateJwk: jwk } },
);
const got = b64urlEncode(out);
console.log(got === V.result ? 'RFC8291 vector: PASS' : `RFC8291 vector: FAIL\n got ${got}\nwant ${V.result}`);
process.exit(got === V.result ? 0 : 1);
