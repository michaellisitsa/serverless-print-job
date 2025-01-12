exports.handler = async (event) => {
  console.log("Connection Event:", JSON.stringify(event));

  return { statusCode: 200 };
};
