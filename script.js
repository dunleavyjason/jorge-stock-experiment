const axios = require('axios');
const fs = require('fs');
const Constrained = require('constrained');



const API_KEY = "8c48192b57789b1b85a59db736780f87";
const API_URL = "https://financialmodelingprep.com/api/v3/quote-short";
const TICKER_DATA_FILE = "./tickers.json";
const NEW_INvESTED_CASH = 500;




(async () => {

    let portfolioTotalValue = 0;

    let tickerDataWithPrices = []; 

    const tickerData = JSON.parse(fs.readFileSync(TICKER_DATA_FILE, "utf-8"));
    
    for (const data of tickerData) {

        const { price } = await axios
            .get(`${API_URL}/${data.ticker}?apikey=${API_KEY}`)
            .then(({ data }) => data[0]);
        
            
        const totalValue = price * data.existingShares;
        portfolioTotalValue += totalValue;

        tickerDataWithPrices.push({
            price,
            totalValue,
            ...data
        });

    };

    const systemVars = {};


    tickerDataWithPrices = tickerDataWithPrices.map(data => {

        const portfolioPercentage = (data.totalValue / portfolioTotalValue);
        const portfolioPercentageDifferential = portfolioPercentage - data.recommendedWeight;

        systemVars[`${data.ticker}Price`] = data.price;
        systemVars[`${data.ticker}ExistingShares`] = data.existingShares;
        systemVars[`${data.ticker}TotalValue`] = data.totalValue;
        systemVars[`${data.ticker}RecommendedWeight`] = data.recommendedWeight;
        systemVars[`${data.ticker}CurrentWeight`] = portfolioPercentage;
        systemVars[`${data.ticker}CurrentDifferential`] = portfolioPercentageDifferential;
        systemVars[`${data.ticker}NewShares`] = 0;
        systemVars[`${data.ticker}NewDifferential`] = 0;



        return {
            ...data,
            portfolioPercentage,
            portfolioPercentageDifferential
        }
        
    });

    systemVars['sum'] = 0;


    const mySystem = new Constrained.System();

    const budgetConstraintProducts = [];
    const sumConstraintProducts = [];
    
    const caclConstraints = [];
    
    tickerDataWithPrices.forEach(data => {

        budgetConstraintProducts.push(`(${data.ticker}TotalValue * ${data.ticker}NewShares)`);
        sumConstraintProducts.push(`(${data.ticker}TotalValue + (${data.ticker}Price * ${data.ticker}NewShares))`);
        

        mySystem.addVariable(data.ticker, systemVars, `${data.ticker}NewShares`);

        caclConstraints.push(
            `((${data.ticker}ExistingShares + ${data.ticker}NewShares) * ${data.ticker}Price) / sum = ${data.ticker}NewDifferential`
        );
        // mySystem.addConstraint(
        //     `((${data.ticker}ExistingShares + ${data.ticker}NewShares) * ${data.ticker}Price) / sum = ${data.ticker}NewDifferential`
        // );

    });



    const budgetConstraint  = `${budgetConstraintProducts.join(' + ')} <= 500`;
    const sumConstraint  = `${sumConstraintProducts.join(' + ')} = sum`;

    console.log(systemVars);
    console.log(budgetConstraint);
    console.log(sumConstraint);
    
    // mySystem.addConstraint(
    //     `${budgetConstraintProducts.join(' + ')} <= 500`
    // );
    // mySystem.addConstraint(
    //     `${sumConstraintProducts.join(' + ')} = sum`
    // );
    

    
    


    // var mySquare = { width: 0, height: 0, area: 0 };
    // var myPerimeter = { length: 10 };
     
    
    


 
    //     mySystem.addConstraint('x + y = c');
    //     mySystem.addConstraint('x >= 0')
    //     mySystem.minimize('x');

    // console.log(mySystem.resolve());
    

    // const analyzable = tickerDataWithPrices.map(tickerData => {

    //     Promise.resolve(tickerData);
    //     return tickerData
    // });

    // tickerDataWithPrices.forEach(async tickerData => {
    //     await tickerData.then(data =>{
    //         analyzable.push({
    //             ...data,
    //             portfolioPercentage: data.totalValue / portfolioTotalValue
    //         })
    //     })
    // });
    

    // console.log(analyzable);
    

    // tickerDataWithPrices.forEach(result => {
    //     console.log(result);
    // })
})();
