exports.handler = async (event) => {
  console.log("Disconnection Event:", JSON.stringify(event));

  return { statusCode: 200 };
};
