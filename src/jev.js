export const API_URL = "https://api.typesafe.ai/v1/systemone";
export const MODEL = "jev-latest";

export const hash = (text) => {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h * 31 + text.charCodeAt(i)) | 0;
  }
  return String(h);
};

export const decideVerdict = (noul, { hideThreshold, blurThreshold }) => {
  if (noul >= hideThreshold) return "hide";
  if (noul >= blurThreshold) return "blur";
  return "leave";
};

export const buildRequest = (posts) => {
  const questions = {};
  for (const [i] of posts.entries()) {
    questions[`post_${i}`] = {
      type: "noul",
      instructions: `Is the post in \`posts[${i}]\` a paid advertisement or promoted content?`,
      criteria: {
        true: "Promotional CTA, product pitch, or sponsored messaging, even without an Ad label",
        false: "Organic user post, reply, or editorial content",
      },
    };
  }
  return {
    state: { posts: posts.map((post) => ({ text: post.text, author: post.author })) },
    model: MODEL,
    questions,
  };
};
