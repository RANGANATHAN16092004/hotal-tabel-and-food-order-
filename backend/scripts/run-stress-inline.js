(async function(){
  const phone = process.argv[2] || '+919876543210';
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  console.log('Testing phone send limit for', phone, 'against', base);
  for (let i=1;i<=10;i++){
    try{
      const res = await fetch(`${base}/customer/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, captchaToken: 'dev' })
      });
      const text = await res.text();
      console.log(`Attempt ${i}: ${res.status} ${text}`);
    }catch(err){
      console.error(`Attempt ${i} error:`, err.message);
    }
    await new Promise(r=>setTimeout(r,200));
  }
})();