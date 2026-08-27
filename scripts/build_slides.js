const pptxgen = require("pptxgenjs");

const NAVY = "1B2A4A";
const PURPLE = "6C3FC5";
const HIGH = "B3261E";
const MED = "B25E00";
const LOW = "1E7A34";
const GREY = "6B7280";
const LIGHT = "F4F4F7";
const WHITE = "FFFFFF";
const DARKCODE = "1E1E2E";
const CODEFONT = "Consolas";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.3 x 7.5
const W = 13.33, H = 7.5;

function bgSlide(bg = WHITE) {
  const s = pres.addSlide();
  s.background = { color: bg };
  return s;
}

function footer(s, n) {
  s.addText("VulnerableVault.sol — Security Audit", {
    x: 0.5, y: H - 0.42, w: 7, h: 0.3, fontSize: 10, color: GREY, isTextBox: true, margin: 0,
  });
  s.addText(String(n), {
    x: W - 1.0, y: H - 0.42, w: 0.5, h: 0.3, fontSize: 10, color: GREY, align: "right", isTextBox: true, margin: 0,
  });
}

function pill(s, text, color, x, y, w = 2.1, h = 0.42) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.08, fill: { color }, line: { type: "none" } });
  s.addText(text, {
    x, y, w, h, align: "center", valign: "middle", color: WHITE, bold: true, fontSize: 13, isTextBox: true, margin: 0,
  });
}

function codeBox(s, lines, x, y, w, h, fontSize = 13) {
  s.addShape("roundRect", { x, y, w, h, rectRadius: 0.06, fill: { color: DARKCODE }, line: { type: "none" } });
  s.addText(
    lines.map((l, i) => ({ text: l, options: { breakLine: i < lines.length - 1 } })),
    { x: x + 0.18, y: y + 0.14, w: w - 0.36, h: h - 0.28, fontFace: CODEFONT, fontSize, color: "E6E6F0", isTextBox: true, margin: 0, valign: "top" }
  );
}

// ============================================================ SLIDE 1 — TITLE
{
  const s = bgSlide(NAVY);
  s.addShape("rect", { x: 0, y: 0, w: W, h: H, fill: { color: NAVY }, line: { type: "none" } });
  s.addShape("oval", { x: 9.6, y: -2.2, w: 6, h: 6, fill: { color: PURPLE, transparency: 78 }, line: { type: "none" } });
  s.addShape("oval", { x: -2.4, y: 4.6, w: 5, h: 5, fill: { color: PURPLE, transparency: 85 }, line: { type: "none" } });

  s.addText("ÉSTIAM PARIS  ·  4BLOCKC / E4CCSN  ·  BLOCKCHAIN SECURITY", {
    x: 0.9, y: 1.35, w: 11.5, h: 0.4, fontSize: 14, color: "B9AEEA", bold: true, charSpacing: 2, isTextBox: true, margin: 0,
  });
  s.addText("Smart Contract Security Audit", {
    x: 0.9, y: 2.0, w: 11.5, h: 1.1, fontSize: 44, color: WHITE, bold: true, isTextBox: true, margin: 0,
  });
  s.addText("VulnerableVault.sol — Find it · Fix it · Present it", {
    x: 0.9, y: 3.05, w: 11.5, h: 0.6, fontSize: 22, color: "D8D2F0", isTextBox: true, margin: 0,
  });

  s.addShape("line", { x: 0.9, y: 3.85, w: 3.2, h: 0, line: { color: PURPLE, width: 2.5 } });

  s.addText([
    { text: "Group: ", options: { bold: true, color: WHITE } },
    { text: "[GROUP NAME]", options: { color: "B9AEEA" } },
  ], { x: 0.9, y: 4.2, w: 11, h: 0.4, fontSize: 16, isTextBox: true, margin: 0 });
  s.addText([
    { text: "Members: ", options: { bold: true, color: WHITE } },
    { text: "[SURNAME Firstname] · [SURNAME Firstname] · [SURNAME Firstname] · [SURNAME Firstname]", options: { color: "B9AEEA" } },
  ], { x: 0.9, y: 4.65, w: 11.5, h: 0.4, fontSize: 16, isTextBox: true, margin: 0 });
  s.addText([
    { text: "Trainer: ", options: { bold: true, color: WHITE } },
    { text: "David de Paula Santos Silva", options: { color: "B9AEEA" } },
  ], { x: 0.9, y: 5.1, w: 11, h: 0.4, fontSize: 16, isTextBox: true, margin: 0 });

  s.addText("9 findings  ·  4 High · 3 Medium · 2 Low  ·  14/14 exploit & fix tests passing", {
    x: 0.9, y: 6.55, w: 11.5, h: 0.4, fontSize: 14, color: "8F86BE", italic: true, isTextBox: true, margin: 0,
  });
}

// ============================================================ SLIDE 2 — WHAT THE CONTRACT DOES
{
  const s = bgSlide(WHITE);
  s.addText("What VulnerableVault Does", { x: 0.6, y: 0.45, w: 12, h: 0.7, fontSize: 30, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText("A staking vault with a periodic random reward round", { x: 0.6, y: 1.05, w: 12, h: 0.4, fontSize: 16, color: GREY, isTextBox: true, margin: 0 });

  const steps = [
    { t: "Deposit", d: "Users send ETH via deposit() or a plain transfer. Balance and total stake are tracked on-chain.", c: PURPLE },
    { t: "Withdraw", d: "Stakers can pull some or all of their ETH back out at any time.", c: PURPLE },
    { t: "Reward round", d: "Every 24h, pickWinner() picks one staker at random and pays them 100 reward tokens.", c: PURPLE },
  ];
  const cardW = 3.75, gap = 0.35, startX = 0.6, cardY = 2.05, cardH = 2.55;
  steps.forEach((st, i) => {
    const x = startX + i * (cardW + gap);
    s.addShape("roundRect", { x, y: cardY, w: cardW, h: cardH, rectRadius: 0.08, fill: { color: LIGHT }, line: { type: "none" } });
    s.addShape("oval", { x: x + 0.25, y: cardY + 0.25, w: 0.55, h: 0.55, fill: { color: st.c }, line: { type: "none" } });
    s.addText(String(i + 1), { x: x + 0.25, y: cardY + 0.25, w: 0.55, h: 0.55, align: "center", valign: "middle", color: WHITE, bold: true, fontSize: 18, isTextBox: true, margin: 0 });
    s.addText(st.t, { x: x + 0.3, y: cardY + 0.95, w: cardW - 0.6, h: 0.4, fontSize: 17, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    s.addText(st.d, { x: x + 0.3, y: cardY + 1.35, w: cardW - 0.6, h: cardH - 1.5, fontSize: 13, color: "333333", isTextBox: true, margin: 0, valign: "top" });
  });

  s.addShape("roundRect", { x: 0.6, y: 4.95, w: 12.1, h: 1.7, rectRadius: 0.08, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("It compiles. It runs. It looks completely normal.", {
    x: 1.0, y: 5.15, w: 11.3, h: 0.55, fontSize: 20, bold: true, color: WHITE, isTextBox: true, margin: 0,
  });
  s.addText("That is exactly what makes it dangerous — nothing about deploying or demoing it would raise an alarm. Four of its nine bugs are independently enough to drain the vault or take it over.", {
    x: 1.0, y: 5.7, w: 11.3, h: 0.8, fontSize: 14, color: "D8D2F0", isTextBox: true, margin: 0,
  });
  footer(s, 2);
}

// ============================================================ SLIDE 3 — METHODOLOGY
{
  const s = bgSlide(WHITE);
  s.addText("Methodology", { x: 0.6, y: 0.45, w: 12, h: 0.7, fontSize: 30, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText("Two passes, as any real audit firm would run", { x: 0.6, y: 1.05, w: 12, h: 0.4, fontSize: 16, color: GREY, isTextBox: true, margin: 0 });

  const cols = [
    { title: "Static analysis", sub: "Slither · 102 detectors", body: "Caught 5 of our 9 findings automatically: reentrancy, arbitrary ETH sends, weak randomness, unchecked transfer, missing zero-checks.", color: PURPLE },
    { title: "Manual review", sub: "\"Who can call this, and can it be gamed?\"", body: "Found the 4 findings Slither's detectors don't look for at all — including 2 of our 4 High-severity bugs.", color: NAVY },
  ];
  const colW = 5.85, colGap = 0.5, colY = 2.0, colH = 3.1;
  cols.forEach((c, i) => {
    const x = 0.6 + i * (colW + colGap);
    s.addShape("roundRect", { x, y: colY, w: colW, h: colH, rectRadius: 0.1, fill: { color: LIGHT }, line: { type: "none" } });
    s.addShape("rect", { x, y: colY, w: 0.12, h: colH, fill: { color: c.color }, line: { type: "none" } });
    s.addText(c.title, { x: x + 0.4, y: colY + 0.3, w: colW - 0.7, h: 0.5, fontSize: 22, bold: true, color: NAVY, isTextBox: true, margin: 0 });
    s.addText(c.sub, { x: x + 0.4, y: colY + 0.85, w: colW - 0.7, h: 0.4, fontSize: 14, italic: true, color: c.color, bold: true, isTextBox: true, margin: 0 });
    s.addText(c.body, { x: x + 0.4, y: colY + 1.4, w: colW - 0.7, h: 1.5, fontSize: 15, color: "333333", isTextBox: true, margin: 0, valign: "top" });
  });

  s.addText([
    { text: "Key takeaway:  ", options: { bold: true, color: HIGH } },
    { text: "a tool-only audit would have missed setOwner()'s missing access control and the reward lottery's fairness flaw — arguably the two most damaging bugs in the contract.", options: { color: "333333" } },
  ], { x: 0.6, y: 5.35, w: 12.1, h: 1.1, fontSize: 16, isTextBox: true, margin: 0, valign: "top" });
  footer(s, 3);
}

// ============================================================ SLIDE 4 — FINDINGS SUMMARY
{
  const s = bgSlide(WHITE);
  s.addText("Findings at a Glance", { x: 0.6, y: 0.4, w: 12, h: 0.7, fontSize: 30, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText("9 findings — 4 High · 3 Medium · 2 Low", { x: 0.6, y: 1.0, w: 12, h: 0.4, fontSize: 16, color: GREY, isTextBox: true, margin: 0 });

  const rows = [
    ["H-01", "Reentrancy in withdraw() drains vault ETH", "High"],
    ["H-02", "setOwner() has no access control", "High"],
    ["H-03", "emergencyWithdraw() has no access control", "High"],
    ["H-04", "Reward lottery gamed by dust deposits", "High"],
    ["M-01", "onlyOwner uses tx.origin (phishable)", "Medium"],
    ["M-02", "Predictable / manipulable randomness", "Medium"],
    ["M-03", "Unchecked reward-token transfer", "Medium"],
    ["L-01", "Missing zero-address validation", "Low"],
    ["L-02", "receive() skips event / dedup logic", "Low"],
  ];
  const sevColor = (v) => (v === "High" ? HIGH : v === "Medium" ? MED : LOW);

  const tableRows = [
    [
      { text: "ID", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 13 } },
      { text: "Finding", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 13 } },
      { text: "Severity", options: { bold: true, color: WHITE, fill: { color: NAVY }, fontSize: 13 } },
    ],
  ];
  rows.forEach((r, i) => {
    const bg = i % 2 ? LIGHT : WHITE;
    tableRows.push([
      { text: r[0], options: { bold: true, fontSize: 13, fill: { color: bg } } },
      { text: r[1], options: { fontSize: 13, fill: { color: bg } } },
      { text: r[2], options: { bold: true, fontSize: 13, color: sevColor(r[2]), fill: { color: bg } } },
    ]);
  });

  s.addTable(tableRows, {
    x: 0.6, y: 1.6, w: 12.1, h: 5.1,
    colW: [1.1, 8.5, 2.5],
    border: { type: "none" },
    autoPage: false,
    valign: "middle",
    rowH: 0.52,
  });
  footer(s, 4);
}

// ============================================================ SLIDE 5 — SPOTLIGHT H-01 REENTRANCY
{
  const s = bgSlide(WHITE);
  s.addText("Spotlight: H-01 — Reentrancy", { x: 0.6, y: 0.4, w: 9, h: 0.65, fontSize: 28, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  pill(s, "HIGH SEVERITY", HIGH, 10.4, 0.48, 2.3, 0.42);

  s.addText("BEFORE — withdraw() sends ETH, then updates balances", { x: 0.6, y: 1.25, w: 12, h: 0.35, fontSize: 14, bold: true, color: HIGH, isTextBox: true, margin: 0 });
  codeBox(s, [
    "(bool sent, ) = msg.sender.call{value: amount}(\"\");",
    "require(sent, \"transfer failed\");",
    "",
    "balances[msg.sender] -= amount;   // too late — the call",
    "totalStaked -= amount;            // already re-entered",
  ], 0.6, 1.65, 12.1, 1.75, 15);

  s.addText("AFTER — balances updated BEFORE the call, plus a reentrancy guard", { x: 0.6, y: 3.6, w: 12, h: 0.35, fontSize: 14, bold: true, color: LOW, isTextBox: true, margin: 0 });
  codeBox(s, [
    "function withdraw(uint256 amount) external nonReentrant {",
    "    balances[msg.sender] = bal - amount;   // effects first",
    "    totalStaked -= amount;",
    "    (bool sent, ) = msg.sender.call{value: amount}(\"\");",
    "}",
  ], 0.6, 4.0, 12.1, 1.75, 15);

  s.addShape("roundRect", { x: 0.6, y: 5.95, w: 12.1, h: 1.0, rectRadius: 0.08, fill: { color: LIGHT }, line: { type: "none" } });
  s.addText([
    { text: "Proof of concept:  ", options: { bold: true, color: NAVY } },
    { text: "an attacker contract deposits 1 ETH, re-enters withdraw() 8×, and walks away with ~9 ETH from a vault seeded with 10 ETH of honest liquidity. Verified in test/VulnerableVault.exploits.test.js.", options: { color: "333333" } },
  ], { x: 0.9, y: 6.1, w: 11.5, h: 0.75, fontSize: 13, isTextBox: true, margin: 0, valign: "top" });
  footer(s, 5);
}

// ============================================================ SLIDE 6 — SPOTLIGHT ACCESS CONTROL + LOGIC BUG
{
  const s = bgSlide(WHITE);
  s.addText("Spotlight: The Bugs a Tool Can't See", { x: 0.6, y: 0.4, w: 12, h: 0.65, fontSize: 28, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText("H-02, H-03 — no access control  ·  H-04 — the lottery can be gamed", { x: 0.6, y: 1.05, w: 12, h: 0.4, fontSize: 15, color: GREY, isTextBox: true, margin: 0 });

  s.addShape("roundRect", { x: 0.6, y: 1.65, w: 5.9, h: 2.55, rectRadius: 0.08, fill: { color: LIGHT }, line: { type: "none" } });
  pill(s, "H-02 / H-03", HIGH, 0.85, 1.85, 1.7, 0.36);
  s.addText("setOwner() / emergencyWithdraw()", { x: 0.85, y: 2.3, w: 5.4, h: 0.4, fontSize: 15, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  codeBox(s, [
    "function setOwner(address newOwner)",
    "    external {",
    "    owner = newOwner;   // no modifier!",
    "}",
  ], 0.85, 2.75, 5.4, 1.3, 13);

  s.addText("Anyone can call these two functions directly — no modifier gates either one. One call takes ownership; the next drains every ETH the vault holds.", {
    x: 6.75, y: 1.85, w: 5.95, h: 2.3, fontSize: 14, color: "333333", isTextBox: true, margin: 0, valign: "top",
  });

  s.addShape("roundRect", { x: 0.6, y: 4.4, w: 12.1, h: 2.55, rectRadius: 0.08, fill: { color: LIGHT }, line: { type: "none" } });
  pill(s, "H-04 — LOGIC BUG", HIGH, 0.85, 4.6, 2.3, 0.36);
  s.addText("The reward lottery weighs ARRAY SLOTS, not real stake", { x: 0.85, y: 5.05, w: 11.6, h: 0.4, fontSize: 15, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText([
    { text: "Alice deposits 10 ETH once → 1 lottery slot.  ", options: { color: "333333" } },
    { text: "Mallory deposits 1 wei, 20 times → 20 lottery slots.", options: { color: "333333", bold: true } },
  ], { x: 0.85, y: 5.5, w: 11.6, h: 0.45, fontSize: 15, isTextBox: true, margin: 0 });
  s.addText("Result: Mallory controls 20 of 21 slots — a ~95% win chance for a fraction of a cent staked, because deposit() never de-duplicates and withdraw() never removes empty stakers. Fixed by a stake-weighted lottery: probability now tracks actual ETH balance, and full withdrawal removes the staker from the pool.", {
    x: 0.85, y: 6.0, w: 11.6, h: 0.85, fontSize: 13, color: "333333", isTextBox: true, margin: 0, valign: "top",
  });
  footer(s, 6);
}

// ============================================================ SLIDE 7 — FIX VERIFICATION
{
  const s = bgSlide(WHITE);
  s.addText("Fix Verification", { x: 0.6, y: 0.4, w: 12, h: 0.65, fontSize: 30, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText("We didn't just claim the fixes work — we tested it", { x: 0.6, y: 1.05, w: 12, h: 0.4, fontSize: 16, color: GREY, isTextBox: true, margin: 0 });

  // left: slither before/after
  s.addShape("roundRect", { x: 0.6, y: 1.75, w: 5.9, h: 4.9, rectRadius: 0.1, fill: { color: LIGHT }, line: { type: "none" } });
  s.addText("Slither — before vs. after", { x: 0.9, y: 1.95, w: 5.3, h: 0.4, fontSize: 17, bold: true, color: NAVY, isTextBox: true, margin: 0 });

  s.addShape("roundRect", { x: 0.9, y: 2.5, w: 5.3, h: 0.95, rectRadius: 0.08, fill: { color: WHITE }, line: { color: HIGH, width: 1 } });
  s.addText("Vulnerable contract", { x: 1.1, y: 2.6, w: 3, h: 0.35, fontSize: 13, bold: true, color: GREY, isTextBox: true, margin: 0 });
  s.addText("14 findings", { x: 1.1, y: 2.9, w: 3, h: 0.5, fontSize: 26, bold: true, color: HIGH, isTextBox: true, margin: 0 });
  s.addText("incl. reentrancy, arbitrary\nETH send, weak PRNG", { x: 4.0, y: 2.62, w: 2.05, h: 0.8, fontSize: 10.5, color: "333333", isTextBox: true, margin: 0 });

  s.addShape("roundRect", { x: 0.9, y: 3.6, w: 5.3, h: 0.95, rectRadius: 0.08, fill: { color: WHITE }, line: { color: LOW, width: 1 } });
  s.addText("Fixed contract", { x: 1.1, y: 3.7, w: 3, h: 0.35, fontSize: 13, bold: true, color: GREY, isTextBox: true, margin: 0 });
  s.addText("9 findings", { x: 1.1, y: 4.0, w: 3, h: 0.5, fontSize: 26, bold: true, color: LOW, isTextBox: true, margin: 0 });
  s.addText("all informational / style —\nzero High or Medium left", { x: 4.0, y: 3.72, w: 2.05, h: 0.8, fontSize: 10.5, color: "333333", isTextBox: true, margin: 0 });

  s.addText("Every tool-detectable High/Medium finding (reentrancy, arbitrary ETH send, unchecked transfer, missing zero-check) is gone. The remaining weak-prng note is a documented, accepted residual risk (§4.2 of the report).", {
    x: 0.9, y: 4.75, w: 5.3, h: 1.75, fontSize: 12.5, color: "333333", isTextBox: true, margin: 0, valign: "top",
  });

  // right: test suite
  s.addShape("roundRect", { x: 6.8, y: 1.75, w: 5.9, h: 4.9, rectRadius: 0.1, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("Hardhat exploit + fix test suite", { x: 7.1, y: 1.95, w: 5.3, h: 0.4, fontSize: 17, bold: true, color: WHITE, isTextBox: true, margin: 0 });
  s.addText("14/14 passing", { x: 7.1, y: 2.4, w: 5.3, h: 0.7, fontSize: 34, bold: true, color: "8FE3A6", isTextBox: true, margin: 0 });

  s.addText("7 tests exploit VulnerableVault.sol — every attack succeeds.", {
    x: 7.1, y: 3.25, w: 5.3, h: 0.55, fontSize: 13, color: "D8D2F0", isTextBox: true, margin: 0,
  });
  s.addText("7 matching tests hit VulnerableVaultFixed.sol with the exact same attacks — every one reverts or is safely handled.", {
    x: 7.1, y: 3.85, w: 5.3, h: 0.8, fontSize: 13, color: "D8D2F0", isTextBox: true, margin: 0,
  });
  codeBox(s, ["$ npx hardhat test --no-compile", "", "  14 passing (1s)"], 7.1, 4.85, 5.3, 1.1, 13);
  s.addText("Reproducible by anyone: npm install && npx hardhat test", {
    x: 7.1, y: 6.1, w: 5.3, h: 0.4, fontSize: 12, italic: true, color: "B9AEEA", isTextBox: true, margin: 0,
  });
  footer(s, 7);
}

// ============================================================ SLIDE 8 — LESSON LEARNED
{
  const s = bgSlide(NAVY);
  s.addShape("oval", { x: -2, y: -2.5, w: 6, h: 6, fill: { color: PURPLE, transparency: 82 }, line: { type: "none" } });
  s.addText("The Lesson We Took From This", { x: 0.9, y: 0.8, w: 11.5, h: 0.7, fontSize: 30, bold: true, color: WHITE, isTextBox: true, margin: 0 });

  s.addShape("roundRect", { x: 0.9, y: 2.0, w: 11.5, h: 3.1, rectRadius: 0.1, fill: { color: "273A63" }, line: { type: "none" } });
  s.addText("\u201cStatic analysis and manual review are complementary, not interchangeable.\u201d", {
    x: 1.3, y: 2.35, w: 10.7, h: 0.9, fontSize: 24, bold: true, italic: true, color: "8FE3A6", isTextBox: true, margin: 0,
  });
  s.addText("Slither caught the reentrancy and the arbitrary ETH transfer in seconds. It caught neither the missing access control on setOwner(), nor the reward lottery's fairness flaw — the two logic bugs that a human found in minutes by asking one question of every function: \"who can call this, and can it be gamed?\"", {
    x: 1.3, y: 3.35, w: 10.7, h: 1.6, fontSize: 15, color: "E6E6F0", isTextBox: true, margin: 0, valign: "top",
  });

  s.addText("A tool-only audit here would have missed 2 of our 4 High-severity findings.", {
    x: 0.9, y: 5.35, w: 11.5, h: 0.5, fontSize: 16, bold: true, color: "B9AEEA", isTextBox: true, margin: 0,
  });
  footer(s, 8);
}

// ============================================================ SLIDE 9 — Q&A
{
  const s = bgSlide(WHITE);
  s.addShape("oval", { x: 9.8, y: -2, w: 6, h: 6, fill: { color: PURPLE, transparency: 88 }, line: { type: "none" } });
  s.addText("Questions?", { x: 0.9, y: 2.7, w: 11.5, h: 1.0, fontSize: 44, bold: true, color: NAVY, isTextBox: true, margin: 0 });
  s.addText("Every member can speak to any finding — audit, report, fix, or test.", {
    x: 0.9, y: 3.7, w: 11.5, h: 0.5, fontSize: 18, color: GREY, isTextBox: true, margin: 0,
  });
  s.addShape("line", { x: 0.9, y: 4.35, w: 3.2, h: 0, line: { color: PURPLE, width: 2.5 } });
  s.addText("Repository layout:  contracts/ \u00b7 test/ \u00b7 docs/report/ \u00b7 docs/slither/", {
    x: 0.9, y: 4.6, w: 11.5, h: 0.4, fontSize: 14, italic: true, color: GREY, isTextBox: true, margin: 0,
  });
  s.addText("[GROUP NAME]  \u00b7  [SURNAME Firstname] \u00b7 [SURNAME Firstname] \u00b7 [SURNAME Firstname] \u00b7 [SURNAME Firstname]", {
    x: 0.9, y: 6.6, w: 11.5, h: 0.4, fontSize: 13, color: GREY, isTextBox: true, margin: 0,
  });
}

pres.writeFile({ fileName: "/home/claude/project/docs/slides/Presentation_EN.pptx" }).then(() => {
  console.log("Wrote Presentation_EN.pptx");
});
