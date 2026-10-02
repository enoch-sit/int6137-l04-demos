(function () {
  const lang = document.body.dataset.lang === "zh" ? "zh" : "en";
  const demo = document.body.dataset.demo || "";
  const zh = lang === "zh";
  const PASS = zh ? "十个工作日" : "ten working days";
  const FAIL = zh ? "暑假旅游" : "Summer trip";
  const sample = "../samples/" + lang + "/";
  const app = document.getElementById("app");
  if (!app || !demo) return;

  const t = zh
    ? {
        specimen: "标本页",
        selector: "CSS 选择器",
        parse: "解析",
        bodyOnly: "只要正文",
        wrongPage: "错误：整页",
        wrongAd: "错误：广告",
        matched: "匹配到的 HTML",
        markdown: "要写入的 Markdown",
        url: "一个网址",
        urls: "网址列表（由你写好，程序不去找链接）",
        fetch: "抓取一次",
        fetchAll: "按列表抓取",
        useSample: "用课上的样本",
        pickFile: "或选择自己的文件",
        pdfNote: "读的是文字层里的字符。这一页不把 PDF 画出来。没有文字层的扫描件要先 OCR，这节课不做。",
        wordNote: ".docx 先读出段落，再包进 article.policy，然后用同一个选择器。",
        githubNote: "默认是本文件夹里的那一份原文，当作你已经知道路径的那个文件。公开仓库的 raw 地址也可以贴进来。",
        path: "文件路径",
        key: "OpenRouter 密钥",
        project: "Supabase 项目地址",
        publishable: "publishable key",
        write: "写入三句",
        query: "查询",
        ranks: "排好的行",
        messages: "messages[]（还没有发给聊天模型）",
        needKey: "先填密钥、项目地址和 publishable key。secret key 不要出现在这个页面上。",
        questions: ["怎么请假", "我对什么过敏", "暑假去哪"],
        lines: [
          { id: "leave", source: "demo", content: "教职员请于出发前十个工作日提交年假申请。" },
          { id: "allergy", source: "demo", content: "我对花生过敏。" },
          { id: "ad", source: "demo", content: "暑假旅游 3 折。" }
        ]
      }
    : {
        specimen: "Specimen page",
        selector: "CSS selector",
        parse: "Parse",
        bodyOnly: "Body only",
        wrongPage: "Wrong: whole page",
        wrongAd: "Wrong: ad",
        matched: "Matched HTML",
        markdown: "Markdown to store",
        url: "One URL",
        urls: "URL list (you typed these; the page does not follow links)",
        fetch: "Fetch once",
        fetchAll: "Fetch the list",
        useSample: "Use the class sample",
        pickFile: "Or choose your own file",
        pdfNote: "This reads characters in the text layer. It does not draw the PDF. A scan with no text layer needs OCR, which this hour does not build.",
        wordNote: "The .docx paragraphs are wrapped in article.policy, then the same selector runs.",
        githubNote: "The default file is the raw text in this folder: one path you already know. A public raw.githubusercontent.com URL also works.",
        path: "File path",
        key: "OpenRouter key",
        project: "Supabase project URL",
        publishable: "publishable key",
        write: "Write three sentences",
        query: "Query",
        ranks: "Ranked rows",
        messages: "messages[] (not sent to a chat model)",
        needKey: "Enter the key, the project URL, and the publishable key. Do not put a secret key on this page.",
        questions: ["How do I apply for leave?", "What am I allergic to?", "Where is the summer trip?"],
        lines: [
          { id: "leave", source: "demo", content: "Apply ten working days before you travel." },
          { id: "allergy", source: "demo", content: "I am allergic to peanuts." },
          { id: "ad", source: "demo", content: "Summer trip, 70% off." }
        ]
      };

  const specimen = zh
    ? specimenHtml(
        "Cookie 条 · 全部接受 · 这不是政策正文",
        "导航：首页 · 关于 · 登录 · 这不是政策正文",
        "侧栏广告 · 暑假旅游 3 折 · 这不是政策正文",
        "年假申请流程",
        "教职员请于出发前十个工作日在门户提交申请。"
      )
    : specimenHtml(
        "Cookie bar · Accept all · not the policy",
        "Nav: Home · About · Sign in · not the policy",
        "Sidebar ad · Summer trip, 70% off · not the policy",
        "Annual leave",
        "Apply ten working days before you travel."
      );

  let lastHtml = "";
  let question = t.questions[0];

  function adWrap(text) {
    const ad = zh ? "侧栏广告 · 暑假旅游 3 折 · 这不是政策正文" : "Sidebar ad · Summer trip, 70% off · not the policy";
    return "<div class='ads'>" + ad + "</div><article class='policy'><p>" + escapeHtml(text) + "</p></article>";
  }

  function specimenHtml(cookie, nav, ad, title, body) {
    return (
      '<div class="cookie">' + cookie + "</div>" +
      '<nav class="site-nav">' + nav + "</nav>" +
      '<div class="ads">' + ad + "</div>" +
      '<article class="policy" id="leave-policy"><h1>' + title + "</h1><p>" + body + "</p></article>"
    );
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function toMarkdown(root) {
    const lines = [];
    root.querySelectorAll("h1,h2,h3,p,li").forEach(function (el) {
      const text = el.innerText.trim();
      if (!text) return;
      if (el.tagName === "H1") lines.push("# " + text);
      else if (el.tagName === "H2") lines.push("## " + text);
      else if (el.tagName === "LI") lines.push("- " + text);
      else lines.push(text);
      lines.push("");
    });
    return lines.join("\n").trim();
  }

  function parse(html, selector) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    let nodes = [];
    try { nodes = Array.from(doc.querySelectorAll(selector)); } catch (err) { nodes = []; }
    const text = nodes.map(function (n) { return n.innerText.trim(); }).filter(Boolean).join("\n\n");
    const markdown = nodes.map(toMarkdown).filter(Boolean).join("\n\n");
    const kept = nodes.map(function (n) { return n.outerHTML; }).join("\n");
    return { count: nodes.length, text: text, markdown: markdown, html: kept };
  }

  function judge(text) {
    const hasPass = text.indexOf(PASS) !== -1;
    const hasFail = text.indexOf(FAIL) !== -1;
    return { hasPass: hasPass, hasFail: hasFail, ok: hasPass && !hasFail };
  }

  function setStatus(message, kind) {
    const el = document.getElementById("status");
    if (!el) return;
    el.textContent = message;
    el.className = kind || "";
  }

  function showParse(result, statusText, kind) {
    document.getElementById("html-out").textContent = result.html || (zh ? "（没有节点）" : "(no nodes)");
    document.getElementById("md-out").textContent = result.markdown || "";
    setStatus(statusText, kind);
  }

  function statusFor(result) {
    if (!result.count) {
      return { text: zh ? "0 个节点" : "0 nodes", kind: "bad" };
    }
    const j = judge(result.text);
    if (j.hasFail) {
      return {
        text: zh ? "未通过。留下的文字里还有「" + FAIL + "」。" : "Fail. The kept text still contains “" + FAIL + "”.",
        kind: "bad"
      };
    }
    if (j.ok) {
      return {
        text: zh ? "通过。留下的文字里有「" + PASS + "」。" : "Pass. The kept text contains “" + PASS + "”.",
        kind: "ok"
      };
    }
    return {
      text: zh
        ? result.count + " 个节点。没有广告，也没有「" + PASS + "」。"
        : result.count + " node(s). The ad is gone, and “" + PASS + "” is not in this chunk.",
      kind: "ok"
    };
  }

  function runSelector(html) {
    lastHtml = html;
    const selector = document.getElementById("selector").value.trim() || "article.policy";
    const result = parse(html, selector);
    const status = statusFor(result);
    showParse(result, status.text, status.kind);
  }

  function parserPanel(extra) {
    return (
      '<section class="panel">' +
      "<label for='selector'>" + t.selector + "</label>" +
      "<input id='selector' type='text' value='article.policy' spellcheck='false' />" +
      '<div class="row">' +
      "<button type='button' class='primary' id='run'>" + t.parse + "</button>" +
      "<button type='button' data-sel='article.policy'>" + t.bodyOnly + "</button>" +
      "<button type='button' data-sel='body'>" + t.wrongPage + "</button>" +
      "<button type='button' data-sel='.ads'>" + t.wrongAd + "</button>" +
      "</div>" +
      (extra || "") +
      "<p id='status'></p>" +
      "<h2>" + t.matched + "</h2><pre id='html-out'></pre>" +
      "<h2>" + t.markdown + "</h2><pre id='md-out'></pre>" +
      "</section>"
    );
  }

  function bindSelectorButtons(getHtml) {
    document.getElementById("run").addEventListener("click", function () {
      Promise.resolve(getHtml()).then(runSelector).catch(function (err) {
        setStatus(err.message || String(err), "bad");
      });
    });
    document.querySelectorAll("[data-sel]").forEach(function (button) {
      button.addEventListener("click", function () {
        document.getElementById("selector").value = button.getAttribute("data-sel");
        Promise.resolve(getHtml()).then(runSelector).catch(function (err) {
          setStatus(err.message || String(err), "bad");
        });
      });
    });
  }

  if (demo === "local") {
    app.innerHTML =
      '<div class="columns"><section class="panel specimen"><h2>' + t.specimen + "</h2><div id='specimen'>" +
      specimen + "</div></section>" + parserPanel("") + "</div>";
    bindSelectorButtons(function () {
      return "<body>" + document.getElementById("specimen").innerHTML + "</body>";
    });
    document.getElementById("run").click();
    return;
  }

  if (demo === "url" || demo === "pages" || demo === "github") {
    const field = demo === "pages"
      ? "<label for='urls'>" + t.urls + "</label><textarea id='urls' spellcheck='false'>" +
        [sample + "page-a.html", sample + "page-b.html", sample + "page-c.html"].join("\n") + "</textarea>"
      : "<label for='url'>" + (demo === "github" ? t.path : t.url) + "</label><input id='url' type='text' spellcheck='false' value='" +
        (demo === "github" ? sample + "leave.md" : sample + "page-a.html") + "' />";
    const note = demo === "github" ? "<p class='hint'>" + t.githubNote + "</p>" : "";
    const button = demo === "pages" ? t.fetchAll : t.fetch;
    app.innerHTML =
      '<div class="columns"><section class="panel"><h2>' + (demo === "github" ? t.path : t.url) + "</h2>" +
      note + field +
      "<div class='row'><button type='button' class='primary' id='fetch'>" + button + "</button></div>" +
      "<pre id='fetched'></pre></section>" + parserPanel("") + "</div>";

    async function load() {
      if (demo === "pages") {
        const urls = document.getElementById("urls").value.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
        const chunks = [];
        for (let i = 0; i < urls.length; i++) {
          const res = await fetch(urls[i]);
          if (!res.ok) throw new Error(urls[i] + " HTTP " + res.status);
          const doc = new DOMParser().parseFromString(await res.text(), "text/html");
          chunks.push(doc.body.innerHTML);
        }
        document.getElementById("fetched").textContent = zh
          ? "抓了 " + chunks.length + " 个地址，各一次。"
          : "Fetched " + chunks.length + " addresses, once each.";
        return "<div>" + chunks.join("\n") + "</div>";
      }
      const url = document.getElementById("url").value.trim();
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      let text = await res.text();
      if (demo === "github") {
        text = adWrap(text);
      }
      document.getElementById("fetched").textContent = text.slice(0, 1200);
      return text;
    }

    document.getElementById("fetch").addEventListener("click", function () {
      load().then(runSelector).catch(function (err) { setStatus(err.message || String(err), "bad"); });
    });
    bindSelectorButtons(function () {
      return lastHtml || load();
    });
    document.getElementById("fetch").click();
    return;
  }

  if (demo === "pdf" || demo === "word") {
    const note = demo === "pdf" ? t.pdfNote : t.wordNote;
    const file = demo === "pdf" ? sample + "leave.pdf" : sample + "leave.docx";
    app.innerHTML =
      '<div class="columns"><section class="panel"><h2>' + (demo === "pdf" ? "PDF" : "Word") + "</h2>" +
      "<p class='hint'>" + note + "</p>" +
      "<div class='row'><button type='button' class='primary' id='sample'>" + t.useSample + "</button></div>" +
      "<label>" + t.pickFile + "</label><input id='file' type='file' />" +
      "<h2>HTML</h2><pre id='fetched'></pre></section>" + parserPanel("") + "</div>";

    async function fromBuffer(buffer) {
      const text = demo === "pdf" ? pdfText(buffer) : await docxText(buffer);
      if (!text) throw new Error(zh ? "没有读到文字" : "No text found");
      const html = adWrap(text);
      document.getElementById("fetched").textContent = html;
      return html;
    }

    document.getElementById("sample").addEventListener("click", function () {
      fetch(file).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.arrayBuffer();
      }).then(fromBuffer).then(runSelector).catch(function (err) {
        setStatus(err.message || String(err), "bad");
      });
    });
    document.getElementById("file").addEventListener("change", function (event) {
      const f = event.target.files && event.target.files[0];
      if (!f) return;
      f.arrayBuffer().then(fromBuffer).then(runSelector).catch(function (err) {
        setStatus(err.message || String(err), "bad");
      });
    });
    bindSelectorButtons(function () { return lastHtml; });
    document.getElementById("sample").click();
    return;
  }

  if (demo === "query") {
    app.innerHTML =
      "<section class='panel'>" +
      "<div class='field'><label for='apikey'>" + t.key + "</label><input id='apikey' type='password' autocomplete='off' /></div>" +
      "<div class='field'><label for='supabase-url'>" + t.project + "</label><input id='supabase-url' type='text' placeholder='https://xxxx.supabase.co' autocomplete='off' /></div>" +
      "<div class='field'><label for='publishable'>" + t.publishable + "</label><input id='publishable' type='password' autocomplete='off' /></div>" +
      "<div class='sentences'>" + t.lines.map(function (line) {
        return "<article><span class='tag'>id · " + line.id + "</span>" + escapeHtml(line.content) + "</article>";
      }).join("") + "</div>" +
      "<div class='row' id='questions'></div>" +
      "<div class='row'><button type='button' class='primary' id='store'>" + t.write + "</button><button type='button' id='ask'>" + t.query + "</button></div>" +
      "<p id='status'></p>" +
      "<h2>" + t.ranks + "</h2><div id='ranks'></div>" +
      "<h2>" + t.messages + "</h2><pre id='messages'></pre>" +
      "</section>";

    const qBox = document.getElementById("questions");
    t.questions.forEach(function (q) {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = q;
      b.addEventListener("click", function () { question = q; });
      qBox.appendChild(b);
    });

    function ready() {
      if (!document.getElementById("apikey").value.trim() || !document.getElementById("supabase-url").value.trim() || !document.getElementById("publishable").value.trim()) {
        setStatus(t.needKey, "bad");
        return false;
      }
      return true;
    }

    function projectUrl() {
      return document.getElementById("supabase-url").value.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
    }

    async function embed(input) {
      const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + document.getElementById("apikey").value.trim()
        },
        body: JSON.stringify({ model: "qwen/qwen3-embedding-4b", input: input, dimensions: 1024 })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || data.error) {
        const msg = (data.error && data.error.message) || res.statusText || "request failed";
        throw new Error("HTTP " + res.status + " " + String(msg).slice(0, 180));
      }
      return data.data.slice().sort(function (a, b) { return a.index - b.index; }).map(function (row) { return row.embedding; });
    }

    async function supabase(path, body, prefer) {
      const key = document.getElementById("publishable").value.trim();
      const headers = { "Content-Type": "application/json", apikey: key, Authorization: "Bearer " + key };
      if (prefer) headers.Prefer = prefer;
      const res = await fetch(projectUrl() + path, { method: "POST", headers: headers, body: JSON.stringify(body) });
      const text = await res.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
      if (!res.ok) throw new Error("HTTP " + res.status + " " + String(data && data.message ? data.message : text).slice(0, 180));
      return data;
    }

    document.getElementById("store").addEventListener("click", async function () {
      if (!ready()) return;
      setStatus(zh ? "正在向 OpenRouter 要 1024 个数…" : "Asking OpenRouter for 1024 numbers…", "");
      try {
        const vectors = await embed(t.lines.map(function (line) { return line.content; }));
        if (vectors.some(function (v) { return v.length !== 1024; })) {
          setStatus(zh ? "返回的长度不是 1024" : "A vector came back with a length other than 1024", "bad");
          return;
        }
        await supabase("/rest/v1/lesson_chunks?on_conflict=id", t.lines.map(function (line, i) {
          return { id: line.id, content: line.content, source: line.source, embedding: vectors[i] };
        }), "resolution=merge-duplicates");
        setStatus(zh ? "三句已写入 lesson_chunks。长度 1024。" : "Three rows are in lesson_chunks. Length 1024.", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("ask").addEventListener("click", async function () {
      if (!ready()) return;
      setStatus(zh ? "正在把问题变成数字…" : "Turning the question into numbers…", "");
      try {
        const vector = (await embed([question]))[0];
        if (vector.length !== 1024) {
          setStatus(zh ? "返回的长度不是 1024" : "The vector length is not 1024", "bad");
          return;
        }
        const rows = await supabase("/rest/v1/rpc/match_lesson_chunks", { query_embedding: vector, match_count: 3 });
        const list = Array.isArray(rows) ? rows : [];
        document.getElementById("ranks").innerHTML = list.map(function (row, i) {
          return "<article class='" + (i === 0 ? "policy" : "") + "'><span class='tag'>id · " + escapeHtml(row.id) + " · " + Number(row.similarity).toFixed(2) + "</span><p>" + escapeHtml(row.content) + "</p></article>";
        }).join("") || "<p class='hint'>—</p>";
        const top = list[0];
        const messages = [
          { role: "system", content: zh ? "只根据下面这一条课文回答。" : "Answer using only the passage below." },
          top ? { role: "system", content: top.content } : null,
          { role: "user", content: question }
        ].filter(Boolean);
        document.getElementById("messages").textContent = JSON.stringify(messages, null, 2);
        setStatus(top
          ? (zh ? "最近的是 " : "Nearest is ") + top.id
          : (zh ? "库里还没有句子。先点写入。" : "No rows yet. Write the three sentences first."),
          top ? "ok" : "bad");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });
  }

  if (demo === "manage") {
    app.innerHTML =
      "<p id='status'></p>" +
      "<div class='columns'>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "文件夹" : "Folder") + "</h2>" +
      "<p class='hint'>" + (zh
        ? "选一个文件夹。一个文本文件是 lesson_chunks 里的一行，整篇不切块。文件名写在 source。这一阶段只收 .txt、.md 和 .markdown。全班共用这一张表，删除会删掉那一行。"
        : "Choose a folder. One text file is one row in lesson_chunks, kept whole. The file name is stored in source. This stage keeps .txt, .md, and .markdown. The class shares this table, so delete removes that row.") + "</p>" +
      "<div class='field'><label for='apikey'>" + t.key + "</label><input id='apikey' type='password' autocomplete='off' /></div>" +
      "<div class='field'><label for='supabase-url'>" + t.project + "</label><input id='supabase-url' type='text' placeholder='https://xxxx.supabase.co' autocomplete='off' /></div>" +
      "<div class='field'><label for='publishable'>" + t.publishable + "</label><input id='publishable' type='password' autocomplete='off' /></div>" +
      "<div class='field'><label for='folder'>" + (zh ? "文件夹" : "Folder") + "</label><input id='folder' type='file' webkitdirectory directory multiple /></div>" +
      "<div id='queue' class='chunk-list'></div>" +
      "<div class='row'><button type='button' class='primary' id='write-folder'>" + (zh ? "写入这些文本" : "Write these texts") + "</button></div>" +
      "</section>" +
      "<section class='panel'>" +
      "<h2>" + (zh ? "表里的行" : "Rows in the table") + "</h2>" +
      "<div class='field'><label for='filter'>" + (zh ? "按 id 或文件名筛选" : "Filter by id or file name") + "</label><input id='filter' type='text' autocomplete='off' /></div>" +
      "<div class='row'><button type='button' id='load'>" + (zh ? "读取" : "Load") + "</button></div>" +
      "<p id='count' class='hint'></p>" +
      "<div id='rows' class='chunk-list'></div>" +
      "<h2>" + (zh ? "选中的一行" : "Selected row") + "</h2>" +
      "<div class='field'><label for='row-id'>id</label><input id='row-id' type='text' autocomplete='off' /></div>" +
      "<div class='field'><label for='row-source'>" + (zh ? "文件名（source）" : "File name (source)") + "</label><input id='row-source' type='text' autocomplete='off' /></div>" +
      "<div class='field'><label for='md-body'>" + (zh ? "正文" : "Text") + "</label><textarea id='md-body'></textarea></div>" +
      "<div class='row'>" +
      "<button type='button' class='primary' id='save'>" + (zh ? "写入这一行" : "Write this row") + "</button>" +
      "<button type='button' id='remove'>" + (zh ? "删除" : "Remove") + "</button>" +
      "</div>" +
      "<h2>" + (zh ? "用一句话看远近" : "Check distance with one sentence") + "</h2>" +
      "<div class='field'><label for='probe'>" + (zh ? "一句话" : "One sentence") + "</label><input id='probe' type='text' autocomplete='off' /></div>" +
      "<div class='row'><button type='button' id='ask'>" + (zh ? "找最近的行" : "Find nearest rows") + "</button></div>" +
      "<div id='ranks'></div>" +
      "</section>" +
      "</div>";

    let loadedId = "";
    let loadedContent = "";
    let queue = [];
    let allRows = [];

    function ready() {
      if (!document.getElementById("apikey").value.trim() || !document.getElementById("supabase-url").value.trim() || !document.getElementById("publishable").value.trim()) {
        setStatus(t.needKey, "bad");
        return false;
      }
      return true;
    }

    function projectUrl() {
      return document.getElementById("supabase-url").value.trim().replace(/\/+$/, "").replace(/\/rest\/v1$/i, "");
    }

    function isTextName(name) {
      return /\.(txt|md|markdown)$/i.test(name);
    }

    function idFromPath(file) {
      const rel = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
      return rel.replace(/\.[^./]+$/, "").trim().toLowerCase().replace(/\s+/g, "-");
    }

    async function embed(input) {
      const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + document.getElementById("apikey").value.trim()
        },
        body: JSON.stringify({ model: "qwen/qwen3-embedding-4b", input: input, dimensions: 1024 })
      });
      const data = await res.json().catch(function () { return {}; });
      if (!res.ok || data.error) {
        const msg = (data.error && data.error.message) || res.statusText || "request failed";
        throw new Error("HTTP " + res.status + " " + String(msg).slice(0, 180));
      }
      return data.data.slice().sort(function (a, b) { return a.index - b.index; }).map(function (row) { return row.embedding; });
    }

    async function rest(method, path, body, prefer) {
      const key = document.getElementById("publishable").value.trim();
      const headers = { apikey: key, Authorization: "Bearer " + key, Accept: "application/json" };
      if (body != null) headers["Content-Type"] = "application/json";
      if (prefer) headers.Prefer = prefer;
      const res = await fetch(projectUrl() + path, {
        method: method,
        headers: headers,
        body: body == null ? undefined : JSON.stringify(body)
      });
      const text = await res.text();
      let data = null;
      if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
      if (!res.ok) throw new Error("HTTP " + res.status + " " + String(data && data.message ? data.message : text).slice(0, 180));
      return data;
    }

    function fillForm(row) {
      document.getElementById("row-id").value = row.id;
      document.getElementById("row-source").value = row.source || "";
      document.getElementById("md-body").value = row.content || "";
      loadedId = row.id;
      loadedContent = row.content || "";
      paintRows();
    }

    function visibleRows() {
      const q = document.getElementById("filter").value.trim().toLowerCase();
      if (!q) return allRows;
      return allRows.filter(function (row) {
        return String(row.id || "").toLowerCase().indexOf(q) !== -1 || String(row.source || "").toLowerCase().indexOf(q) !== -1;
      });
    }

    function paintRows() {
      const box = document.getElementById("rows");
      const list = visibleRows();
      const count = document.getElementById("count");
      count.textContent = zh
        ? "表里 " + allRows.length + " 行。这里显示 " + list.length + " 行。"
        : allRows.length + " rows in the table. Showing " + list.length + ".";
      box.innerHTML = "";
      if (!allRows.length) {
        box.innerHTML = "<p class='hint'>" + (zh ? "表是空的。" : "The table is empty.") + "</p>";
        return;
      }
      if (!list.length) {
        box.innerHTML = "<p class='hint'>" + (zh ? "没有对上的行。" : "No rows match.") + "</p>";
        return;
      }
      list.forEach(function (row) {
        const article = document.createElement("article");
        if (row.id === loadedId) article.className = "picked";
        article.innerHTML = "<span class='tag'>id · " + escapeHtml(row.id) + "</span><span class='tag'>" + escapeHtml(row.source || "") + "</span><pre>" + escapeHtml(row.content || "") + "</pre>";
        article.addEventListener("click", function () { fillForm(row); });
        box.appendChild(article);
      });
    }

    function paintQueue() {
      const box = document.getElementById("queue");
      box.innerHTML = "";
      if (!queue.length) {
        box.innerHTML = "<p class='hint'>" + (zh ? "还没有文件夹。" : "No folder yet.") + "</p>";
        return;
      }
      queue.forEach(function (item) {
        const article = document.createElement("article");
        if (item.skip) article.className = "skip";
        article.innerHTML = "<span class='tag'>" + escapeHtml(item.name) + "</span><span class='tag'>" +
          escapeHtml(item.skip || ("id · " + item.id)) + "</span><p class='hint'>" +
          escapeHtml(item.path) + (item.text ? " · " + item.text.length : "") + "</p>";
        box.appendChild(article);
      });
    }

    async function readQueue(fileList) {
      const files = Array.prototype.slice.call(fileList || []);
      const used = {};
      const next = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = (file.webkitRelativePath || file.name).replace(/\\/g, "/");
        if (!isTextName(file.name)) {
          next.push({ name: file.name, path: path, skip: zh ? "不是文本" : "Not text" });
          continue;
        }
        const text = await file.text();
        if (!text.trim()) {
          next.push({ name: file.name, path: path, skip: zh ? "是空的" : "Empty" });
          continue;
        }
        let id = idFromPath(file);
        if (!id) id = "file";
        const base = id;
        let n = 2;
        while (used[id]) {
          id = base + "-" + n;
          n += 1;
        }
        used[id] = true;
        next.push({ id: id, source: file.name, text: text, name: file.name, path: path, skip: "" });
      }
      return next;
    }

    async function loadRows() {
      const rows = await rest("GET", "/rest/v1/lesson_chunks?select=id,content,source&order=id.asc");
      allRows = Array.isArray(rows) ? rows : [];
      paintRows();
      return allRows;
    }

    async function writeOne(id, source, content) {
      const same = id === loadedId && content === loadedContent;
      if (same) {
        await rest("PATCH", "/rest/v1/lesson_chunks?id=eq." + encodeURIComponent(id), { source: source }, "return=minimal");
        return "source";
      }
      const vector = (await embed([content]))[0];
      if (!vector || vector.length !== 1024) throw new Error(zh ? "返回的长度不是 1024" : "The vector length is not 1024");
      await rest("POST", "/rest/v1/lesson_chunks?on_conflict=id", {
        id: id,
        content: content,
        source: source,
        embedding: vector
      }, "resolution=merge-duplicates,return=minimal");
      loadedId = id;
      loadedContent = content;
      return "embed";
    }

    document.getElementById("folder").addEventListener("change", async function (event) {
      queue = await readQueue(event.target.files);
      paintQueue();
      const ready = queue.filter(function (item) { return !item.skip; });
      const skipped = queue.length - ready.length;
      if (!ready.length) {
        setStatus(zh ? "这个文件夹里没有可写入的文本。" : "This folder has no text to write.", "bad");
        return;
      }
      setStatus(zh
        ? "可写入 " + ready.length + " 个文本。" + (skipped ? " 跳过 " + skipped + " 个。" : "")
        : ready.length + " text files can be written." + (skipped ? " Skipped " + skipped + "." : ""), "");
    });

    document.getElementById("filter").addEventListener("input", paintRows);

    document.getElementById("write-folder").addEventListener("click", async function () {
      if (!ready()) return;
      const readyItems = queue.filter(function (item) { return !item.skip; });
      if (!readyItems.length) {
        setStatus(zh ? "先选一个含有文本的文件夹。" : "Choose a folder that contains text files.", "bad");
        return;
      }
      try {
        for (let i = 0; i < readyItems.length; i++) {
          const item = readyItems[i];
          setStatus((zh ? "正在写入 " : "Writing ") + (i + 1) + "/" + readyItems.length + " · " + item.name, "");
          loadedId = "";
          loadedContent = "";
          await writeOne(item.id, item.source, item.text);
        }
        await loadRows();
        setStatus(zh ? "已写入 " + readyItems.length + " 行。长度 1024。" : "Wrote " + readyItems.length + " rows. Length 1024.", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("load").addEventListener("click", async function () {
      if (!ready()) return;
      setStatus(zh ? "正在读取…" : "Loading…", "");
      try {
        const list = await loadRows();
        setStatus(zh ? "读到 " + list.length + " 行。" : "Loaded " + list.length + " rows.", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("save").addEventListener("click", async function () {
      if (!ready()) return;
      try {
        const id = document.getElementById("row-id").value.trim();
        const source = document.getElementById("row-source").value.trim();
        const content = document.getElementById("md-body").value;
        if (!id || !content.trim()) {
          setStatus(zh ? "先填 id，并放上正文。" : "Enter an id and some text.", "bad");
          return;
        }
        if (!source) {
          setStatus(zh ? "先填文件名。" : "Enter the file name.", "bad");
          return;
        }
        setStatus(zh ? "正在写入…" : "Writing…", "");
        const kind = await writeOne(id, source, content);
        await loadRows();
        setStatus(kind === "source"
          ? (zh ? "只更新了来源。没有重新算数字。" : "Updated source only. The numbers were not recomputed.")
          : (zh ? "已写入。长度 1024。" : "Stored. Length 1024."), "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("remove").addEventListener("click", async function () {
      if (!ready()) return;
      const id = document.getElementById("row-id").value.trim();
      if (!id) {
        setStatus(zh ? "先填要删除的 id。" : "Enter the id to remove.", "bad");
        return;
      }
      setStatus(zh ? "正在删除…" : "Removing…", "");
      try {
        await rest("DELETE", "/rest/v1/lesson_chunks?id=eq." + encodeURIComponent(id), null, "return=minimal");
        if (loadedId === id) {
          loadedId = "";
          loadedContent = "";
          document.getElementById("md-body").value = "";
          document.getElementById("row-source").value = "";
        }
        await loadRows();
        setStatus(zh ? "已删除 " + id + "。" : "Removed " + id + ".", "ok");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    document.getElementById("ask").addEventListener("click", async function () {
      if (!ready()) return;
      const question = document.getElementById("probe").value.trim();
      if (!question) {
        setStatus(zh ? "先写一句话。" : "Enter one sentence.", "bad");
        return;
      }
      setStatus(zh ? "正在把这句话变成数字…" : "Turning that sentence into numbers…", "");
      try {
        const vector = (await embed([question]))[0];
        if (!vector || vector.length !== 1024) throw new Error(zh ? "返回的长度不是 1024" : "The vector length is not 1024");
        const rows = await rest("POST", "/rest/v1/rpc/match_lesson_chunks", { query_embedding: vector, match_count: 3 });
        const list = Array.isArray(rows) ? rows : [];
        document.getElementById("ranks").innerHTML = list.map(function (row, i) {
          return "<article class='" + (i === 0 ? "policy" : "") + "'><span class='tag'>id · " + escapeHtml(row.id) + " · " + Number(row.similarity).toFixed(2) + "</span><span class='tag'>" + escapeHtml(row.source || "") + "</span><p>" + escapeHtml(row.content) + "</p></article>";
        }).join("") || "<p class='hint'>—</p>";
        setStatus(list[0]
          ? (zh ? "最近的是 " : "Nearest is ") + list[0].id
          : (zh ? "库里还没有行。" : "No rows yet."),
          list[0] ? "ok" : "bad");
      } catch (err) {
        setStatus(err.message || String(err), "bad");
      }
    });

    paintQueue();
    paintRows();
  }

  function pdfText(buffer) {
    const bytes = new Uint8Array(buffer);
    let raw = "";
    for (let i = 0; i < bytes.length; i++) raw += String.fromCharCode(bytes[i]);
    const parts = [];
    const hexRe = /<([0-9A-Fa-f\s]+)>/g;
    let match;
    while ((match = hexRe.exec(raw))) {
      const hex = match[1].replace(/\s+/g, "");
      if (hex.indexOf("FEFF") !== 0 || hex.length < 8) continue;
      let text = "";
      for (let i = 4; i + 4 <= hex.length; i += 4) {
        const code = parseInt(hex.slice(i, i + 4), 16);
        if (!Number.isNaN(code)) text += String.fromCharCode(code);
      }
      if (text.trim()) parts.push(text.trim());
    }
    const litRe = /\(((?:\\.|[^\\)])*)\)\s*Tj/g;
    while ((match = litRe.exec(raw))) {
      parts.push(match[1].replace(/\\n/g, "\n").replace(/\\([()\\])/g, "$1"));
    }
    return parts.join("\n").trim();
  }

  function unzipStored(buffer) {
    const bytes = new Uint8Array(buffer);
    const files = {};
    let i = 0;
    while (i + 30 < bytes.length) {
      if (bytes[i] !== 0x50 || bytes[i + 1] !== 0x4b || bytes[i + 2] !== 0x03 || bytes[i + 3] !== 0x04) break;
      const method = bytes[i + 8] | (bytes[i + 9] << 8);
      const size = bytes[i + 18] | (bytes[i + 19] << 8) | (bytes[i + 20] << 16) | (bytes[i + 21] << 24);
      const nameLen = bytes[i + 26] | (bytes[i + 27] << 8);
      const extraLen = bytes[i + 28] | (bytes[i + 29] << 8);
      const name = new TextDecoder().decode(bytes.slice(i + 30, i + 30 + nameLen));
      const start = i + 30 + nameLen + extraLen;
      if (method !== 0) throw new Error(zh ? "这份 docx 是压缩的" : "This docx is compressed");
      files[name] = bytes.slice(start, start + size);
      i = start + size;
    }
    return files;
  }

  async function docxText(buffer) {
    const files = unzipStored(buffer);
    const xmlBytes = files["word/document.xml"];
    if (!xmlBytes) throw new Error(zh ? "找不到 word/document.xml" : "word/document.xml is missing");
    const xml = new TextDecoder("utf-8").decode(xmlBytes);
    return xml.split(/<\/w:p>/).map(function (part) {
      return Array.from(part.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)).map(function (m) {
        return m[1].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      }).join("");
    }).filter(Boolean).join("\n").trim();
  }
})();
