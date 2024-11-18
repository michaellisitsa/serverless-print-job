exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  const messages = [
    "We build our computer (systems) the way we build our cities: over time, without a plan, on top of ruins. - Ellen Ullman",
    "Every great developer you know got there by solving problems they were unqualified to solve until they actually did it. - Patrick McKenzie",
    "Rules of Optimisation: Rule 1: Don't do it. Rule 2 (for experts only): Don't do it yet. - Michael A. Jackson",
    "No one in the brief history of computing has ever written a piece of perfect software. It's unlikely that you'll be the first. - Andy Hunt",
    "One of the best programming skills you can have is knowing when to walk away for a while. - Oscar Godson",
    "It's hard enough to find an error in your code when you're looking for it; it's even harder when you've assumed your code is error-free. - Steve McConnell",
    "The first 90% of the code accounts for the first 90% of the development time. The remaining 10% of the code accounts for the other 90% of the development time. - Tom Cargill",
    "Good code is its own best documentation. As you're about to add a comment, ask yourself, \"How can I improve the code so that this comment isn't needed?\" Improve the code and then document it to make it even clearer. - Steve McConnell",
    "One of my most productive days was throwing away 1000 lines of code. - Ken Thompson",
    "The computer was born to solve problems that did not exist before. - Bill Gates",
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
    },
    body: randomMessage,
  };
};
