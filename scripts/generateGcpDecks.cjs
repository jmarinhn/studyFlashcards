const fs = require('fs');
const path = require('path');

const gcpDocsDir = '/Users/jdmarinv/Dev/gcp-networking-docs';
const outputDocsDecksDir = path.join(gcpDocsDir, 'decks');
const outputPublicDecksDir = '/Users/jdmarinv/Dev/studyFlashcards/public/decks';

// Create directories if they do not exist
[outputDocsDecksDir, outputPublicDecksDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

function cleanKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Fallback high-quality explanations for questions not directly present in master_quiz
const customExplanations = {
  'anengineerregularlyworksincloudshell':
    'Cloud Shell provides 5 GB of persistent storage in $HOME. System files outside $HOME are discarded when the VM is recycled after 1 hour of inactivity. Adding configuration scripts to ~/.profile ensures environment variables persist across sessions.',
  'whichcapabilitiesarenativelyprovidedbycloudshell':
    'Cloud Shell includes 5 GB of persistent $HOME storage, automatic authentication via Google Cloud Console credentials, and pre-installed developer tools (gcloud, kubectl, bq, docker). Cloud Shell VMs are recycled after inactivity, not permanent.',
  'anapplicationrequiresagloballyscalablerelationaldatabasewithtransactionalintegrity':
    'Cloud Spanner provides a fully managed, globally distributed relational database with horizontal scale and strong external ACID consistency across multiple regions and continents.',
  'youhavecreatedacustomsubnetwithacidrblockof19216810029':
    'A /29 subnet has 8 total addresses (2^(32-29) = 8). Google Cloud reserves 4 addresses (.0 network, .1 default gateway, second-to-last reserved for future use, and last broadcast), leaving exactly 4 usable host IP addresses (.2 through .5).',
  'yourengineeringteamneedstoexpandtheiprangeofanactive':
    'Expanding the CIDR block of an existing subnet in Google Cloud is a hitless, non-disruptive operation with zero downtime for running virtual machines.',
  'whichofthefollowingstatementsregardinggooglecloudexternalipaddressesis':
    'Google Cloud charges a higher hourly rate for reserved static external IP addresses that are unattached to any running instance, to discourage IP address waste and encourage efficient IPv4 allocation.',
  'anincomingrequestfromtheinternetreachesawebservervmoverport443':
    'Google Cloud VPC firewall rules are stateful: if an incoming connection is permitted by an ingress rule, all return response traffic for that session is automatically allowed regardless of egress firewall rules.',
  'asecurityengineercreatestwoingressfirewallrulesmatchingthesametargetinstance':
    'Firewall rules are evaluated in ascending numerical order of priority (0 has highest precedence). Priority 500 (DENY) is evaluated before priority 1000 (ALLOW), and the first matching rule terminates evaluation.',
  'youconfigureacustomstaticrouteinyourvpcdirectingtrafficdestinedfor10500016':
    'In Google Cloud, routing and firewall rules operate as distinct layers. Traffic requires BOTH a matching route to the destination and an explicit firewall ALLOW rule; otherwise the packets are dropped.',
  'twocomputeenginevirtualmachinesvmaandvmbresidewithintheexactsamezone':
    'When two VMs communicate using external IP addresses, packets route through Google Cloud external network edge points and are charged at inter-zone egress rates rather than free internal VPC traffic.',
  'anadministratordeletesallvpcnetworksinatestproject':
    'Compute Engine virtual machine instances require at least one network interface (nic0) attached to a VPC network and subnet. If no VPC network exists, VM creation fails immediately.',
  'youhavefourvmsdeployedingooglecloud':
    'Google Cloud VPC networks are global, allowing VMs in different regions of the same VPC to communicate seamlessly using internal IPs. Conversely, distinct VPC networks are completely isolated by default, even if instances share the same physical zone.'
};

// Parse questions from Markdown content
function parseMarkdownQuestions(content, masterExplanationsMap = new Map()) {
  const lines = content.split('\n');
  const questions = [];
  let currentQ = null;
  let inOptions = false;
  let inExplanation = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect Question Header
    const qMatch = line.match(/^###\s+Question\s*(\d+)?(?:\s*\((.*?)\))?/i);
    if (qMatch) {
      if (currentQ && currentQ.questionLines.length > 0 && Object.keys(currentQ.options).length > 0) {
        questions.push(currentQ);
      }
      currentQ = {
        number: qMatch[1] || String(questions.length + 1),
        title: qMatch[2] ? qMatch[2].trim() : '',
        questionLines: [],
        options: {},
        answer: '',
        explanation: ''
      };
      inOptions = false;
      inExplanation = false;
      continue;
    }

    if (!currentQ) continue;

    // Detect Answer
    const ansMatch = line.match(/^\*`Answer:\s*([^`]+)`\*/i);
    if (ansMatch) {
      const rawAns = ansMatch[1].trim();
      currentQ.answer = rawAns.replace(/[^A-Za-z]/g, '').toUpperCase();
      inOptions = false;
      continue;
    }

    // Detect Explanation in markdown
    const expMatch = line.match(/^>\s*\*Explanation:\*\s*(.*)/i);
    if (expMatch) {
      currentQ.explanation = expMatch[1].trim();
      inExplanation = true;
      continue;
    }
    if (inExplanation) {
      if (line.startsWith('>')) {
        currentQ.explanation += ' ' + line.replace(/^>\s*/, '').trim();
        continue;
      } else if (line.trim().startsWith('---') || line.startsWith('###')) {
        inExplanation = false;
      }
    }

    // Detect Options: * **A)** text or * **A.** text
    const optMatch = line.match(/^\*\s+\*\*([A-E])(?:\)|\.|\:)\*\*\s*(.*)/i);
    if (optMatch) {
      inOptions = true;
      const letter = optMatch[1].toUpperCase();
      currentQ.options[letter] = optMatch[2].trim();
      continue;
    }

    // Question body
    if (!inOptions && !currentQ.answer && !inExplanation) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('---')) {
        currentQ.questionLines.push(trimmed);
      }
    }
  }

  if (currentQ && currentQ.questionLines.length > 0 && Object.keys(currentQ.options).length > 0) {
    questions.push(currentQ);
  }

  // Format and enrich questions
  const formattedObj = {};
  questions.forEach((q, index) => {
    const qText = q.questionLines.join(' ').trim();
    let explanation = q.explanation;

    // If explanation is missing, look up in master map
    if (!explanation) {
      const cleanQ = cleanKey(qText);
      for (const [mKey, mExp] of masterExplanationsMap.entries()) {
        if (cleanQ.includes(mKey.slice(0, 45)) || mKey.includes(cleanQ.slice(0, 45))) {
          explanation = mExp;
          break;
        }
      }
    }

    // If still missing, check custom explanations
    if (!explanation) {
      const cleanQ = cleanKey(qText);
      for (const [cKey, cExp] of Object.entries(customExplanations)) {
        if (cleanQ.includes(cKey.slice(0, 30)) || cKey.includes(cleanQ.slice(0, 30))) {
          explanation = cExp;
          break;
        }
      }
    }

    // Fallback default
    if (!explanation) {
      explanation = `La respuesta correcta es ${q.answer}. Consulta la lección teórica para más detalles.`;
    }

    formattedObj[String(index + 1)] = {
      question: qText,
      options: q.options,
      answer_official: q.answer || 'A',
      answer_community: q.answer || 'A',
      explanation: explanation
    };
  });

  return formattedObj;
}

// 1. Build Master Quiz explanation map first
const masterContent = fs.readFileSync(path.join(gcpDocsDir, 'master_quiz.md'), 'utf8');
const masterMap = new Map();
const masterQuestions = parseMarkdownQuestions(masterContent);
Object.values(masterQuestions).forEach((item) => {
  if (item.explanation) {
    masterMap.set(cleanKey(item.question), item.explanation);
  }
});

console.log(`[Init] Loaded ${masterMap.size} master quiz questions with explanations.`);

// 2. Process each markdown file
const files = fs.readdirSync(gcpDocsDir).filter((f) => f.endsWith('.md'));
const manifest = [];

files.forEach((file) => {
  const filePath = path.join(gcpDocsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  const jsonDeck = parseMarkdownQuestions(content, masterMap);
  const count = Object.keys(jsonDeck).length;

  if (count > 0) {
    const jsonFileName = file.replace(/\.md$/, '.json');
    const jsonString = JSON.stringify(jsonDeck, null, 2);

    // Save to gcp-networking-docs/decks/
    fs.writeFileSync(path.join(outputDocsDecksDir, jsonFileName), jsonString, 'utf8');

    // Also save directly in gcp-networking-docs/ alongside the .md file for immediate access
    fs.writeFileSync(path.join(gcpDocsDir, jsonFileName), jsonString, 'utf8');

    // Save to studyFlashcards/public/decks/
    fs.writeFileSync(path.join(outputPublicDecksDir, jsonFileName), jsonString, 'utf8');

    manifest.push({ file: jsonFileName, questions: count });
    console.log(`✓ Generated ${jsonFileName} (${count} questions)`);
  } else {
    console.log(`! Skipped ${file} (no questions found)`);
  }
});

// 3. Write a manifest file for the decks
fs.writeFileSync(
  path.join(outputDocsDecksDir, 'index.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(outputPublicDecksDir, 'index.json'),
  JSON.stringify(manifest, null, 2),
  'utf8'
);

console.log(`\n🎉 Success! Generated ${manifest.length} JSON decks.`);
