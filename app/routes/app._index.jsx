import { useState, useEffect } from "react";
import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, useActionData, useNavigate } from "@remix-run/react";
import {
  Page, Layout, Card, Text, TextField, Button, BlockStack, Box,
  Banner, Select, Checkbox, InlineStack, Badge, Divider, List
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  // authenticate.admin() автоматически обрабатывает OAuth
  const { admin, billing, session } = await authenticate.admin(request);

  console.log("🔍 Проверка подписки в /app...");
  console.log("🏪 Shop:", session.shop);

  // Проверяем, это dev store или production
  let hasSubscription = false;
  let subscription = null;
  let isDevStore = false;
  let planName = "Unknown";

  try {
    // Получаем информацию о плане магазина
    const shopResponse = await admin.graphql(
      `#graphql
      query {
        shop {
          plan {
            displayName
          }
        }
      }`
    );

    const shopData = await shopResponse.json();
    planName = shopData.data?.shop?.plan?.displayName || "Unknown";
    console.log("📊 Plan:", planName);

    // Определяем dev store (case-insensitive)
    isDevStore = planName.toLowerCase().includes("partner") ||
                 planName.toLowerCase().includes("development") ||
                 planName.toLowerCase().includes("trial") ||
                 planName.toLowerCase().includes("affiliate") ||
                 planName.toLowerCase().includes("app development");
    console.log("🔧 Is dev store:", isDevStore);

    // На dev store пропускаем проверку подписки
    if (!isDevStore) {
      const response = await admin.graphql(
        `#graphql
        query {
          currentAppInstallation {
            activeSubscriptions {
              id
              name
              status
              test
              trialDays
              currentPeriodEnd
            }
          }
        }`
      );

      const data = await response.json();
      const subscriptions = data.data?.currentAppInstallation?.activeSubscriptions || [];
      hasSubscription = subscriptions.length > 0;
      subscription = subscriptions[0] || null;

      console.log("📊 Active subscriptions:", subscriptions);
      console.log("✅ Has subscription:", hasSubscription);
      if (subscription) {
        console.log("✅ Subscription status:", subscription.status);
        console.log("✅ Subscription test mode:", subscription.test);
        console.log("✅ Subscription trial days:", subscription.trialDays);
      }
    } else {
      console.log("✅ Dev store detected, skipping subscription check");
      hasSubscription = true; // Разрешаем доступ на dev store
    }
  } catch (err) {
    console.error("❌ Subscription check error:", err);
    // При ошибке предполагаем dev store для тестирования
    isDevStore = true;
    hasSubscription = true;
    console.log("⚠️ Error occurred, assuming dev store for testing");
  }

  // Получаем метаданные
  const response = await admin.graphql(
    `#graphql
    query {
      currentAppInstallation {
        metafields(first: 25, namespace: "sheet_pulse") {
          edges {
            node {
              key
              value
            }
          }
        }
      }
    }`
  );
  const resJson = await response.json();
  const fields = resJson.data?.currentAppInstallation?.metafields?.edges || [];
  const qRaw = fields.find(f => f.node.key === 'q_json')?.node.value;

  return json({
    questions: qRaw ? JSON.parse(qRaw) : [{ id: Date.now(), type: 'emoji', label: 'How was your experience?' }],
    gUrl: fields.find(f => f.node.key === 'g_url')?.node.value || "",
    tType: fields.find(f => f.node.key === 't_type')?.node.value || "timer",
    tVal: fields.find(f => f.node.key === 't_val')?.node.value || "3",
    tDev: fields.find(f => f.node.key === 't_dev')?.node.value || "all",
    aCol: fields.find(f => f.node.key === 'a_col')?.node.value || "#008060",
    lang: fields.find(f => f.node.key === 'lang')?.node.value || "en",
    status: fields.find(f => f.node.key === 'status')?.node.value || "active",
    widgetPosition: fields.find(f => f.node.key === 'w_pos')?.node.value || "right",
    shop: session.shop,
    billingStatus: { hasPayment: hasSubscription, isTrial: false },
    requiresAuth: false,
    hasSubscription, // Добавляем флаг для клиентского редиректа
    subscription, // Добавляем полную информацию о подписке
    isDevStore, // Флаг dev store
    planName // Название плана
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "test_connection") {
    try {
      const res = await fetch(formData.get("gurl"), {
        method: "POST",
        body: JSON.stringify({ respondentId: "TEST", device: "Desktop", lang: "en", answer: {"Connection Test": "Success 🚀"}, pageUrl: "Admin" })
      });
      return json({ testOk: res.ok });
    } catch (e) { return json({ testOk: false }); }
  }

  try {
    console.log("🔧 Starting action handler");

    const appRes = await admin.graphql(`{currentAppInstallation{id}}`);
    const appResData = await appRes.json();
    console.log("📋 App installation response:", appResData);

    if (appResData.errors) {
      console.error("❌ App installation query errors:", appResData.errors);
      throw new Error(`App installation query failed: ${JSON.stringify(appResData.errors)}`);
    }

    const appId = appResData.data.currentAppInstallation.id;
    console.log("✅ Got app ID:", appId);

    const data = Object.fromEntries(formData);
    console.log("📝 Full form data:", data);

    // Validate required fields
    if (!data.q) {
      throw new Error("Questions data is missing");
    }

    // Parse and validate questions
    let questions;
    try {
      questions = JSON.parse(data.q);
      console.log("✅ Parsed questions:", questions);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Questions must be a non-empty array");
      }
    } catch (e) {
      console.error("❌ Failed to parse questions:", e, "Raw data:", data.q);
      throw new Error(`Invalid questions format: ${e.message}`);
    }

    const m = [
      { namespace: "sheet_pulse", key: "q_json", type: "json", value: data.q, ownerId: appId },
      { namespace: "sheet_pulse", key: "g_url", type: "single_line_text_field", value: data.gurl || "", ownerId: appId },
      { namespace: "sheet_pulse", key: "t_type", type: "single_line_text_field", value: data.ttype || "timer", ownerId: appId },
      { namespace: "sheet_pulse", key: "t_val", type: "single_line_text_field", value: data.tval || "3", ownerId: appId },
      { namespace: "sheet_pulse", key: "t_dev", type: "single_line_text_field", value: data.tdev || "all", ownerId: appId },
      { namespace: "sheet_pulse", key: "a_col", type: "single_line_text_field", value: data.acol || "#008060", ownerId: appId },
      { namespace: "sheet_pulse", key: "lang", type: "single_line_text_field", value: data.lang || "en", ownerId: appId },
      { namespace: "sheet_pulse", key: "status", type: "single_line_text_field", value: data.status || "active", ownerId: appId },
      { namespace: "sheet_pulse", key: "w_pos", type: "single_line_text_field", value: data.wpos || "right", ownerId: appId },
      { namespace: "sheet_pulse", key: "survey_version", type: "single_line_text_field", value: String(questions[0]?.id || Date.now()), ownerId: appId }
    ];

    console.log("📤 Sending metafields:", m);

    const result = await admin.graphql(`mutation save($m:[MetafieldsSetInput!]!){metafieldsSet(metafields:$m){metafields{key}}}`, { variables: { m } });
    const resultData = await result.json();

    console.log("✅ Metafields update result:", resultData);

    if (resultData.errors) {
      console.error("❌ GraphQL errors:", resultData.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(resultData.errors)}`);
    }

    return json({ saved: true });
  } catch (error) {
    console.error("❌ Action error:", error);
    console.error("❌ Stack trace:", error.stack);
    return json(
      { error: error.message, details: error.toString() },
      { status: 500 }
    );
  }
};

function Preview({ questions, color, lang }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [selected, setSelected] = useState([]);
  const [textVal, setTextVal] = useState("");
  const [otherVal, setOtherVal] = useState("");

  const q = questions[step];

  useEffect(() => { setSelected([]); setTextVal(""); setOtherVal(""); }, [step, questions]);

  const canNext = (() => {
    if (!q) return false;
    if (q.type === 'text' && textVal.trim().length > 0) return true;
    if (q.type !== 'text' && selected.length > 0) return true;
    if ((q.type === 'radio' || q.type === 'checkbox') && otherVal.trim().length > 0) return true;
    if (selected.includes("Skip")) return true;
    return false;
  })();

  const handleSelect = (val) => {
    if (val === "Skip") { handleNext(); return; }
    if (q.type === 'checkbox') {
      if (selected.includes(val)) setSelected(selected.filter(i => i !== val));
      else setSelected([...selected, val]);
    } else {
      setSelected([val]);
      if (q.type === 'radio') setOtherVal("");
    }
  };

  const handleOtherChange = (val) => { setOtherVal(val); if (val.trim().length > 0) setSelected([]); };
  const handleNext = () => { if (step < questions.length - 1) setStep(step + 1); else setDone(true); };

  const i18n = {
    en: { next: "Next", finish: "Finish", thanks: "Thank you! 🚀", skip: "Not sure", other: "Other..." },
    es: { next: "Siguiente", finish: "Finalizar", thanks: "¡Gracias! 🚀", skip: "No lo sé", other: "Otro..." },
    de: { next: "Weiter", finish: "Beenden", thanks: "Danke! 🚀", skip: "Nicht sicher", other: "Anderes..." },
    fr: { next: "Suivant", finish: "Terminer", thanks: "Merci! 🚀", skip: "Pas sûr", other: "Autre..." },
    pt: { next: "Próximo", finish: "Finalizar", thanks: "Obrigado! 🚀", skip: "Não sei", other: "Outro..." }
  }[lang] || { next: "Next", finish: "Finish", thanks: "Thank you! 🚀", skip: "Not sure", other: "Other..." };

  const cleanColor = color && color.trim() ? color.replace(/^#/, '') : '000000';
  const themeColor = '#' + cleanColor;
  const isWhite = themeColor.toLowerCase() === '#ffffff' || themeColor.toLowerCase() === '#fff';
  const isBlack = themeColor.toLowerCase() === '#000000' || themeColor.toLowerCase() === '#000' || cleanColor === '111' || parseInt(cleanColor, 16) < 0x333333;
  const btnTxt = '#ffffff';
  const btnBorder = isWhite ? '1px solid #ccc' : 'none';
  const selectedBg = isBlack ? '#333333' : themeColor;

  const btnStyle = { padding: '12px', border: '1px solid #eee', borderRadius: '12px', background: '#fff', cursor: 'pointer', fontSize: '14px', textAlign: 'left', display: 'flex', alignItems: 'center', width: '100%', marginBottom: '8px', transition: '0.15s', boxSizing: 'border-box', color: '#333' };
  const activeStyle = { ...btnStyle, backgroundColor: selectedBg, color: btnTxt };

  if (done) return (
    <div style={{ padding: '40px', background: '#fff', borderRadius: '18px', boxShadow: '0 12px 50px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0', width: '350px', margin: '0 auto', textAlign: 'center' }}>
      <Text variant="headingMd" as="h2">{i18n.thanks}</Text>
      <Box paddingBlockStart="400"><Button onClick={()=>{setStep(0);setDone(false)}}>Reset Preview</Button></Box>
    </div>
  );

  const isEmoji5 = q?.type === 'emoji5';
  const renderScaleButtons = () => {
    const max = parseInt(q.scaleMax || 5);
    return Array.from({length: max}, (_, i) => {
      const isSelected = selected.includes(i+1);
      return <button key={i} onClick={()=>handleSelect(i+1)} style={{padding: '14px 0', border: '1px solid #eee', borderRadius: '8px', background: isSelected ? selectedBg : '#fff', color: isSelected ? btnTxt : '#333', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: '0.15s'}}>{i+1}</button>;
    });
  };

  return (
    <div style={{ padding: '20px', background: '#fff', borderRadius: '18px', boxShadow: '0 12px 50px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0', width: '350px', margin: '0 auto', overflow: 'hidden' }}>
      <div style={{display:'flex', justifyContent:'space-between', marginBottom:'8px'}}>
         <span style={{fontSize:'9px', fontWeight:'800', color:themeColor, textTransform:'uppercase'}}>STEP {step + 1}/{questions.length}</span>
         <span style={{fontSize:'22px', color:'#bbb', lineHeight:'0.5', cursor:'pointer'}}>×</span>
      </div>
      <p style={{fontWeight:'700', marginBottom:'15px', fontSize:'16px', color:'#111', lineHeight:'1.4'}}>{q?.label}</p>

      <Box minHeight="120px">
        {q?.type.includes('emoji') && (
          <div style={{display: 'flex', justifyContent: isEmoji5 ? 'space-between' : 'space-around', gap: isEmoji5 ? '2px' : '5px', width: '100%', boxSizing: 'border-box', marginBottom: '10px'}}>
            {(q.type === 'emoji' ? ['😞','😐','🤩'] : ['😡','😟','😐','🙂','😍']).map(e => (
              <button key={e} onClick={()=>handleSelect(e)} style={{fontSize: isEmoji5 ? '32px' : '42px', border: 'none', background: 'transparent', cursor: 'pointer', transform: selected.includes(e) ? (isEmoji5 ? 'scale(1.15)' : 'scale(1.2)') : 'scale(1)', transition: '0.15s', flexShrink: 0, padding: '0', lineHeight: 1}}>{e}</button>
            ))}
          </div>
        )}

        {(q?.type === 'radio' || q?.type === 'checkbox') && (
           <div style={{display:'flex', flexDirection:'column', gap: '8px'}}>
             {q.options?.split(',').map(o => o.trim()).map(o => {
               const isSelected = selected.includes(o);
               return (
                 <button key={o} onClick={()=>handleSelect(o)} style={isSelected ? activeStyle : btnStyle}>
                   {q.type === 'checkbox' && (
                     <span style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '2px solid ' + (isSelected ? (isBlack ? '#333' : themeColor) : '#ddd'), marginRight: '10px', borderRadius: '4px', flexShrink: 0, verticalAlign: 'middle', transition: '0.15s', backgroundColor: isSelected ? (isBlack ? '#333' : themeColor) : 'transparent'}}>
                       <span style={{fontSize: '12px', fontWeight: 'bold', color: '#fff', opacity: isSelected ? 1 : 0, transition: '0.15s'}}>✓</span>
                     </span>
                   )}
                   {o}
                 </button>
               );
             })}
             {(q.hasOther || q.notSure) && (
               <div style={{display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px'}}>
                 {q.hasOther && <input type="text" placeholder={i18n.other} value={otherVal} onChange={(e)=>handleOtherChange(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', boxSizing: 'border-box', fontSize: '13px'}} />}
                 {q.notSure && <button onClick={()=>handleSelect("Skip")} style={{...btnStyle, border: '1px dashed #ddd', color: '#666', textAlign: 'center', justifyContent: 'center', marginTop: 0}}>{i18n.skip}</button>}
               </div>
             )}
           </div>
        )}

        {q?.type === 'scale' && (
          <div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(' + (q.scaleMax||5) + ', 1fr)', gap: '5px'}}>{renderScaleButtons()}</div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#999', marginTop:'8px'}}><span>{q.labelL}</span><span>{q.labelR}</span></div>
          </div>
        )}

        {q?.type === 'text' && (
          <div>
            <textarea placeholder={q.placeholder || '...'} value={textVal} onChange={(e)=>setTextVal(e.target.value)} style={{width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #eee', minHeight: '70px', boxSizing: 'border-box', fontSize: '14px', fontFamily: 'inherit'}} />
            {q.notSure && <button onClick={()=>handleSelect("Skip")} style={{...btnStyle, border: '1px dashed #ddd', color: '#666', textAlign: 'center', justifyContent: 'center', marginTop: '8px'}}>{i18n.skip}</button>}
          </div>
        )}
      </Box>

      <div style={{marginTop:'20px'}}>
        <button onClick={() => canNext && handleNext()} disabled={!canNext} style={{width: '100%', background: themeColor, color: btnTxt, border: btnBorder, padding: '14px', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: canNext ? 'pointer' : 'default', opacity: canNext ? 1 : 0, transition: 'opacity 0.3s, background 0.3s', boxShadow: canNext ? '0 2px 5px rgba(0,0,0,0.1)' : 'none', display: canNext ? 'block' : 'none'}}>
          {step === questions.length - 1 ? i18n.finish : i18n.next}
        </button>
      </div>
    </div>
  );
}

export default function Index() {
  const settings = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const nav = useNavigation();
  const navigate = useNavigate();

  // Клиентский редирект при отсутствии подписки
  useEffect(() => {
    if (!settings.hasSubscription && !settings.isDevStore) {
      console.log("⚠️ No subscription on production store, redirecting to billing...");
      // Небольшая задержка, чтобы убедиться, что подписка действительно не активна
      const timer = setTimeout(() => {
        console.log("🔄 Confirming no subscription, redirecting...");
        navigate("/app/billing");
      }, 1000);

      return () => clearTimeout(timer);
    } else if (settings.isDevStore) {
      console.log("✅ Dev store detected, skipping subscription check");
    } else {
      console.log("✅ Subscription found:", settings.subscription);
    }
  }, [settings.hasSubscription, settings.isDevStore, settings.subscription, navigate]);

  const [questions, setQuestions] = useState(settings.questions);
  const [aCol, setACol] = useState(settings.aCol);
  const [gUrl, setGUrl] = useState(settings.gUrl);
  const [status, setStatus] = useState(settings.status);
  const [tType, setTType] = useState(settings.tType);
  const [tVal, setTVal] = useState(settings.tVal);
  const [tDev, setTDev] = useState(settings.tDev);
  const [lang, setLang] = useState(settings.lang);
  const [wPos, setWPos] = useState(settings.widgetPosition);

  const move = (idx, dir) => { const newQ = [...questions]; const [item] = newQ.splice(idx, 1); newQ.splice(idx + dir, 0, item); setQuestions(newQ); };
  const save = (s) => {
    console.log("📤 Client-side save called with:", {
      questions: questions.length,
      gurl: gUrl,
      status: s || status,
      allData: {
        q: JSON.stringify(questions),
        gurl: gUrl,
        ttype: tType,
        tval: tVal,
        tdev: tDev,
        acol: aCol,
        lang: lang,
        status: s || status,
        wpos: wPos
      }
    });
    submit({ q: JSON.stringify(questions), gurl: gUrl, ttype: tType, tval: tVal, tdev: tDev, acol: aCol, lang, status: s || status, wpos: wPos }, { method: "POST" });
  };

  const bridgeCode = `function doPost(e) { try { var ss = SpreadsheetApp.getActiveSpreadsheet(); var sheet = ss.getSheets()[0]; var postData = e.postData.contents; if (!postData) return ContentService.createTextOutput(JSON.stringify({"error": "No data"})).setMimeType(ContentService.MimeType.JSON); var data = JSON.parse(postData); var answers = data.answer; if (typeof answers === 'string') { try { answers = JSON.parse(answers); } catch(e) { answers = {"Answer": answers }; } } if (sheet.getLastRow() === 0) { var headers = ["Date", "Respondent ID", "Device", "Language", "Page URL"]; Object.keys(answers || {}).forEach(k => headers.push(k)); sheet.appendRow(headers); sheet.getRange(1,1,1,headers.length).setFontWeight("bold").setBackground("#f4f4f4"); } var row = [new Date(), data.respondentId||"Unknown", data.device||"Unknown", data.lang||"en", data.pageUrl||"Unknown"]; var h = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0]; for(var i=5;i<h.length;i++) row.push(answers?.[h[i]] || "-"); sheet.appendRow(row); return ContentService.createTextOutput(JSON.stringify({"result":"success"})).setMimeType(ContentService.MimeType.JSON); } catch(e) { return ContentService.createTextOutput(JSON.stringify({"error":e.toString()})).setMimeType(ContentService.MimeType.JSON); } }`;

  return (
    <Page title="SheetPulse: Professional Survey Builder">
      <Layout>
        <Layout.Section>
          <BlockStack gap="500">

            {settings.isDevStore && (
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">🔧 Development Mode</Text>
                  <Banner status="info">
                    <p>This is a development store. Subscription check is disabled for testing purposes.</p>
                    <p>Plan: {settings.planName}</p>
                  </Banner>
                </BlockStack>
              </Card>
            )}

            {settings.subscription && (
              <Card>
                <BlockStack gap="400">
                  <Text variant="headingMd">✅ Active Subscription</Text>
                  <div style={{ marginTop: "1rem" }}>
                    <p><strong>Plan:</strong> {settings.subscription.name}</p>
                    <p><strong>Status:</strong> {settings.subscription.status}</p>
                    <p><strong>Test mode:</strong> {settings.subscription.test ? "Yes" : "No"}</p>
                    {settings.subscription.trialDays > 0 && (
                      <p><strong>Trial days:</strong> {settings.subscription.trialDays} days 🎉</p>
                    )}
                  </div>
                </BlockStack>
              </Card>
            )}

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">1. Connect Google Sheets</Text>
                <List type="number">
                  <List.Item>Create a new Google Sheet. Open it.</List.Item>
                  <List.Item>In the top menu, go to <b>Extensions → Apps Script</b>.</List.Item>
                  <List.Item>Delete any existing code and <b>Paste the Bridge Code</b> (find it in the right sidebar).</List.Item>
                  <List.Item>Click <b>Deploy → New Deployment</b>. Select type: <b>Web App</b>.</List.Item>
                  <List.Item>Set "Execute as: <b>Me</b>" and "Who has access: <b>Anyone</b>".</List.Item>
                  <List.Item>Click Deploy, Authorize access, and <b>Copy the Web App URL</b>.</List.Item>
                </List>
                <Divider />
                <TextField label="Paste your Web App URL here" value={gUrl} onChange={setGUrl} placeholder="https://script.google.com/macros/s/.../exec" />
                <InlineStack gap="300">
                  <Button onClick={() => submit({ intent: "test_connection", gurl: gUrl }, { method: "POST" })} loading={nav.state === "submitting"}>Test Connection</Button>
                  {actionData?.testOk && <Badge tone="success">Success!</Badge>}
                  {actionData?.testOk === false && <Badge tone="critical">Failed</Badge>}
                </InlineStack>
              </BlockStack>
            </Card>

            <Card>
              <InlineStack align="space-between">
                <Text variant="headingMd">Survey Status: <Badge tone={status === 'active' ? 'success' : 'attention'}>{status.toUpperCase()}</Badge></Text>
                <InlineStack gap="200">
                  <Button onClick={() => {setStatus('stopped'); save('stopped')}} disabled={status === 'stopped'}>Stop Survey</Button>
                  <Button variant="primary" onClick={() => {setStatus('active'); save('active')}} disabled={status === 'active'}>Launch on Site</Button>
                </InlineStack>
              </InlineStack>
            </Card>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">🔄 Reset Survey</Text>
                <Text tone="subdued">Reset the survey to allow users to take it again. This will clear the "already completed" status for all visitors.</Text>
                <Button variant="primary" onClick={() => {
                  if (confirm('Are you sure you want to reset the survey? This will allow all visitors to take it again.')) {
                    // Clear localStorage for the current survey
                    const surveyId = questions[0]?.id || 'default';
                    localStorage.removeItem(`sp_done_${surveyId}`);
                    localStorage.removeItem(`sp_closed_${surveyId}`);
                    localStorage.removeItem(`sp_version_${surveyId}`);
                    alert('Survey has been reset! All visitors can now take the survey again.');
                  }
                }}>
                  Reset Survey
                </Button>
              </BlockStack>
            </Card>

            {questions.map((q, idx) => (
              <Card key={q.id}>
                <BlockStack gap="400">
                  <InlineStack align="space-between">
                    <InlineStack gap="200">
                      <Text variant="headingSm">Step {idx + 1}</Text>
                      <Button onClick={()=>move(idx, -1)} disabled={idx===0} plain>↑</Button>
                      <Button onClick={()=>move(idx, 1)} disabled={idx===questions.length-1} plain>↓</Button>
                    </InlineStack>
                    <Button tone="critical" onClick={() => setQuestions(questions.filter(x => x.id !== q.id))} variant="plain">Remove</Button>
                  </InlineStack>
                  <TextField label="Question" value={q.label} onChange={(v) => setQuestions(questions.map(x => x.id === q.id ? {...x, label: v} : x))} autoComplete="off" />
                  <Select label="Type" options={[{label:'Emoji (3 faces)',value:'emoji'},{label:'Emoji (5 faces)',value:'emoji5'},{label:'Single Choice',value:'radio'},{label:'Multiple Choice',value:'checkbox'},{label:'Rating Scale',value:'scale'},{label:'Open Text',value:'text'}]} value={q.type} onChange={(v) => setQuestions(questions.map(x => x.id === q.id ? {...x, type: v} : x))} />
                  {q.type === 'scale' && (
                    <InlineStack gap="400">
                      <div style={{flex:1}}><Select label="Max" options={['5','7','10'].map(v=>({label:v,value:v}))} value={q.scaleMax || '5'} onChange={(v)=>setQuestions(questions.map(x=>x.id===q.id?{...x, scaleMax:v}:x))} /></div>
                      <div style={{flex:1}}><TextField label="Min Label" value={q.labelL} onChange={(v)=>setQuestions(questions.map(x=>x.id===q.id?{...x, labelL:v}:x))} placeholder="Poor" /></div>
                      <div style={{flex:1}}><TextField label="Max Label" value={q.labelR} onChange={(v)=>setQuestions(questions.map(x=>x.id===q.id?{...x, labelR:v}:x))} placeholder="Excellent" /></div>
                    </InlineStack>
                  )}
                  {(q.type === 'radio' || q.type === 'checkbox') && (
                    <>
                      <TextField label="Options (comma separated)" value={q.options} onChange={(v) => setQuestions(questions.map(x => x.id === q.id ? {...x, options: v} : x))} />
                      <Checkbox label="Add 'Other' with input" checked={q.hasOther} onChange={(v) => setQuestions(questions.map(x => x.id === q.id ? {...x, hasOther: v} : x))} />
                    </>
                  )}
                  {q.type === 'text' && <TextField label="Input Placeholder" value={q.placeholder} onChange={(v)=>setQuestions(questions.map(x => x.id === q.id ? {...x, placeholder: v} : x))} placeholder="e.g. Tell us more..." />}
                  <Checkbox label="Allow 'Not sure' / Skip" checked={q.notSure} onChange={(v) => setQuestions(questions.map(x => x.id === q.id ? {...x, notSure: v} : x))} />
                </BlockStack>
              </Card>
            ))}
            <Button onClick={() => setQuestions([...questions, {id: Date.now(), type:'emoji', label:'New Question'}])}>Add Survey Step</Button>

            {/* PREVIEW AFTER QUESTIONS */}
            <Card>
              <BlockStack gap="400" align="center">
                <Text variant="headingMd" as="h2">📱 Live Preview</Text>
                <div style={{background:'#f4f6f8', padding:'30px', borderRadius:'12px', width:'100%', boxSizing:'border-box'}}>
                  <Preview questions={questions} color={aCol} lang={lang} />
                </div>
                <InlineStack gap="300" align="center">
                  <TextField label="Accent Color" value={aCol} onChange={setACol} prefix="#" style={{width:'120px'}} />
                  <Select label="Position" options={[{label:'Right',value:'right'},{label:'Left',value:'left'}]} value={wPos} onChange={setWPos} style={{width:'120px'}} />
                </InlineStack>
              </BlockStack>
            </Card>

            <Divider />
            <InlineStack align="space-between">
               <Text tone="subdued">Settings sync automatically when you click Sync.</Text>
               <Button variant="primary" size="large" onClick={() => save()} loading={nav.state === "submitting"}>Sync & Save All</Button>
            </InlineStack>

            <Card>
              <BlockStack gap="400">
                <Text variant="headingMd">⚠️ Important: Google Sheets Data</Text>
                <Text tone="subdued"><b>If you change question order, question text, or question types</b> (e.g., from emoji to text), the data in your Google Sheet may no longer match the new structure.</Text>
                <Text tone="subdued"><b>Options:</b></Text>
                <List>
                  <List.Item>Create a new Google Sheet and update the Web App URL</List.Item>
                  <List.Item>Or manually adjust your existing sheet headers to match new questions</List.Item>
                </List>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>

        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card title="Triggers & Language">
               <BlockStack gap="400">
                  <Select label="Display Language" options={[{label:'English',value:'en'},{label:'Spanish',value:'es'},{label:'German',value:'de'},{label:'French',value:'fr'},{label:'Portuguese',value:'pt'}]} value={lang} onChange={setLang} />
                  <Select label="Target Device" options={[{label:'All Devices',value:'all'},{label:'Desktop Only',value:'desktop'},{label:'Mobile Only',value:'mobile'}]} value={tDev} onChange={setTDev} />
                  <Select label="Trigger Event" options={[{label:'Timer',value:'timer'},{label:'Exit Intent',value:'exit'},{label:'Cart Item Count',value:'cart'},{label:'Purchase (Thank you)',value:'purchase'}]} value={tType} onChange={setTType} />
                  {(tType === 'timer' || tType === 'cart') && <TextField label={tType === 'timer' ? "Wait time (seconds)" : "Item Count"} type="number" value={tVal} onChange={setTVal} />}
               </BlockStack>
            </Card>

            <Card title="Copy Bridge Code">
               <textarea readOnly style={{width:'100%', height:'150px', fontSize:'10px', fontFamily:'monospace', padding:'8px', background:'#f4f4f4', border:'1px solid #ddd'}} value={bridgeCode} />
               <Box paddingBlockStart="200"><Button fullWidth onClick={() => {navigator.clipboard.writeText(bridgeCode); alert("Copied!")}}>Copy Code</Button></Box>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
      <Box paddingBlockEnd="1000" />
    </Page>
  );
}