try {
    const url = "mysql://clinicos_user:afK10f[122G1gaoiI@152.67.40.125:5432/clinicosdb";
    new URL(url);
    console.log("URL is valid");
} catch (e) {
    console.error("URL is invalid:", e.message);
}
