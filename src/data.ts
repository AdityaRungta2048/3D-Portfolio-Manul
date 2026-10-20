import scholarshipSunat from "./assets/creatives/scholarship-sunat.webp";
import admissionOpen2026 from "./assets/creatives/admission-open-2026.webp";
import lastChance31Aug from "./assets/creatives/last-chance-31-aug.webp";
import cyberSecurity from "./assets/creatives/cyber-security.webp";
import janmashtamiJhanki from "./assets/creatives/janmashtami-jhanki.webp";
import janmashtamiCampusMoments from "./assets/creatives/janmashtami-campus-moments.webp";
import janmashtamiPoster from "./assets/creatives/janmashtami-poster.webp";
import janmashtamiRadhaKrishna from "./assets/creatives/janmashtami-radha-krishna.webp";
import janmashtamiPortrait from "./assets/creatives/janmashtami-portrait.webp";
import janmashtamiAbhishek from "./assets/creatives/janmashtami-abhishek.webp";
import portrait from "./assets/manul.webp";

export const person = {
  name: "Manul Poonia",
  monogram: "MP",
  title: "Video Editor & Project Manager",
  email: "manulpoonia@gmail.com",
  phone: "+91 8279459351",
  location: "Moradabad, India 244001",
  portrait,
  summary:
    "Experienced Video Editor and Project Manager with 5+ years in crafting engaging visual stories and promotional content. Specializes in cinematic editing, motion graphics, color grading, and sound design. Collaborates with diverse clients to deliver compelling narratives that enhance brand campaigns and drive audience engagement.",
};

export const roles = [
  "cinematic stories",
  "brand campaigns",
  "motion graphics",
  "sound that lands",
];

export const experience = [
  {
    role: "Lead Video Editor",
    org: "Marcom Department, Sanskriti University, Mathura",
    period: "Dec 2025 – Present",
    points: [
      "Collaborating with marketing teams for branding and campaigns.",
      "Applying modern cinematic editing, motion graphics, and storytelling techniques.",
      "Systematized and archived raw footage for efficient future editing access.",
      "Edited video content to enhance promotional materials, create hype and highlight university events.",
      "Collaborated with team members to develop creative video concepts.",
    ],
  },
  {
    role: "Video Editor",
    org: "Pehachan Media, Gurgaon",
    period: "2025",
    points: [
      "Reviewed footage and selected key scenes for final production cuts.",
      "Edited and enhanced raw footage into compelling visual stories.",
      "Applied color grading, sound design, and visual effects.",
    ],
  },
  {
    role: "Video Editor",
    org: "Trading With Sidhant, Remote",
    period: "2024",
    points: ["Edited finance-related content to enhance clarity and engage audiences."],
  },
  {
    role: "Video Editor",
    org: "MyIndia, Remote",
    period: "2020 – 2021",
    points: [
      "Produced high-engagement video content that increased viewer retention and audience interaction.",
      "Learned focused storytelling and pacing for maximum retention.",
    ],
  },
];

export const services = [
  { title: "Brand campaign films", text: "Promotional films built alongside marketing teams: a cinematic cut, motion graphics and a grade that matches the brand." },
  { title: "Event highlight reels", text: "Footage systematised, the key moments selected, and the whole thing paced into a cut that builds hype around the occasion." },
  { title: "Motion graphics", text: "Titles, lower thirds and animated sequences designed to carry a brand consistently across a whole series of videos." },
  { title: "Short-form social", text: "Retention-first pacing and hooks built for social feeds, cut to hold attention all the way to the end." },
  { title: "Cinematic colour grading", text: "Looks built shot by shot, using colour to carry the mood and keep a sequence visually consistent throughout." },
  { title: "Score & sound design", text: "Original background scoring and a sound design pass that gives the picture its weight and sense of scale." },
];

export const skills = [
  "Video Editing",
  "Cinematic color grading",
  "Background Scoring",
  "Motion graphics design",
  "Content storytelling",
  "Social media strategy",
  "Generative AI Tools",
  "Music Production",
];

export const tools = [
  "Adobe Premiere Pro",
  "After Effects",
  "Photoshop",
  "Figma",
  "DaVinci Resolve",
  "Adobe Audition",
  "FL Studio",
  "suno.ai",
  "Runway ML",
  "Midjourney",
  "Higgsfield",
  "ChatGPT",
  "Gemini",
];

export const education = {
  degree: "B.Tech, Mechanical Engineering",
  school: "MIT, Moradabad",
  period: "2022",
};

export type Work = {
  title: string;
  category: string;
  client: string;
  year: string;
  cover: string;
  /** Wide artwork is letterboxed on the 9:16 card instead of cropped. */
  wide?: boolean;
  /** Optional muted preview clip; cards without one just show the cover. */
  video?: string;
  href: string;
};

const su = { client: "Sanskriti University", year: "2026" };

export const works: Work[] = [
  { ...su, title: "Krishna Janmashtami Poster", category: "Carousel Post", cover: janmashtamiPoster, href: "https://drive.google.com/file/d/19xx0M9jQB7yvtorJ1LV9Q5XMxQLjScMe/view" },
  { ...su, title: "Admission Open 2026", category: "Portal Banner", cover: admissionOpen2026, wide: true, href: "https://drive.google.com/file/d/1KNHBzxzFASaNskLDRpqLqdlr4ZnrDX9-/view" },
  { ...su, title: "Janmashtami Jhanki", category: "Carousel Post", cover: janmashtamiJhanki, href: "https://drive.google.com/file/d/1HT6h3zzee_KRJ4uRvhIYGX4FATWMEZ8F/view" },
  { ...su, title: "100% Scholarship via SUNAT", category: "Portal Banner", cover: scholarshipSunat, wide: true, href: "https://drive.google.com/file/d/1EObyV9rVfG87e4C7mEhh4ZoEUCw-l6ZW/view" },
  { ...su, title: "Radha Krishna Performance", category: "Carousel Post", cover: janmashtamiRadhaKrishna, href: "https://drive.google.com/file/d/1d_MBEXlI8YTb6My8GtjlSSbbARrGSbjl/view" },
  { ...su, title: "Janmashtami Campus Moments", category: "Carousel Post", cover: janmashtamiCampusMoments, href: "https://drive.google.com/file/d/1wgOlgyl7haVUnyeDCq86fAISUlRyJIQv/view" },
  { ...su, title: "Last Chance To Apply – 31st August", category: "Portal Banner", cover: lastChance31Aug, wide: true, href: "https://drive.google.com/file/d/1Hxg4OsFLWJ0METsWJRpVx2wJrhy4vCK7/view" },
  { ...su, title: "Janmashtami Celebration Portrait", category: "Carousel Post", cover: janmashtamiPortrait, href: "https://drive.google.com/file/d/1w6YYV2Kd-mEzGFui3f3hB8gGmKZjYpsM/view" },
  { ...su, title: "B.Tech & BCA Cyber Security", category: "Portal Banner", cover: cyberSecurity, wide: true, href: "https://drive.google.com/file/d/1TFXqI_St6U1FSazDNWh5s8S2X6AmFb1N/view" },
  { ...su, title: "Janmashtami Abhishek", category: "Carousel Post", cover: janmashtamiAbhishek, href: "https://drive.google.com/file/d/1z-ItqKbuRAvBVpgL9v7Tpe3iFpDJDPdh/view" },
];

export const driveUrl = "https://drive.google.com/drive/folders/1ErySkeyCHHRdxSP3_I6nEjnibWYzjY6u";
