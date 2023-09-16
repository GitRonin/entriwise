// Styles
import "./style.css"

// Constants
import { monthNames } from '../../constants'

// Hooks
import { useState } from 'react'

const convertDate = (date) => {
    const orderDate = new Date(date)
    const newDate = `${monthNames[orderDate.getMonth()]}-${orderDate.getDate()}`
    return newDate;
}

const getCurrency = async (items) => {
    const uniqueCurrency = [];
    const isUnique = obj => {
        if (obj.currency && obj.currency !== 'USD') {
            return !uniqueCurrency.some(existingObj => existingObj.currency === obj.currency);
        }
    }

    // Filter unique currencies
    for (const obj of items) {
        if (isUnique(obj)) {
            uniqueCurrency.push(obj);
        }
    }

    // We make requests for the currency to USD ratio
    let updatedCurrency = [];
    for (const pair of uniqueCurrency) {
        const response = await fetch(`https://api.exchangerate.host/convert?from=${pair.currency}&to=USD&amount=1`).then(response => response.json())
        const result = response.result;
        updatedCurrency.push({ currency: pair.currency, amount: result });
    }
    return updatedCurrency
}

// Change the amount field according to the exchange rate to USD
const convertCurrencyAmount = (item, currencies) => {
    const currentCurrency = currencies.filter(elem => elem.currency === item.currency)[0]
    if (!currentCurrency) return item.amount
    return currentCurrency.amount * item.amount
};

const downloadFile = ({ data, fileName, fileType }) => {
    const blob = new Blob([data], { type: fileType })

    const a = document.createElement('a')
    a.download = fileName
    a.href = window.URL.createObjectURL(blob)
    const clickEvt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
    })
    a.dispatchEvent(clickEvt)
    a.remove()
}

const exportToCsv = (data) => {
    // Headers for each column
    let headers = ['itemName, orderId, orderDate, amount']

    // Convert data to a csv
    let currencyCsv = data.reduce((acc, currency) => {
        const { itemName, orderId, orderDate, amount } = currency
        acc.push([itemName, orderId, orderDate, amount].join(','))
        return acc
    }, [])

    downloadFile({
        data: [...headers, ...currencyCsv].join('\n'),
        fileName: 'currency.csv',
        fileType: 'text/csv',
    })
}

export const Button = () => {
    // States
    const [isLoading, setIsLoading] = useState(false);

    const handleClick = async () => {
        try {
            if (isLoading) return;
            setIsLoading(true)
            const responseOrders = await fetch('https://api-staging.entriwise.com/mock/test-task-orders').then(response => response.json())
            const responseItems = await fetch('https://api-staging.entriwise.com/mock/test-task-items').then(response => response.json())
            const currencies = await getCurrency(responseItems.items)
            const currencyData = responseOrders.orders.map(order => {
                const currentItem = responseItems.items.filter(item => item.itemId === order.itemId)[0];
                const newOrder = {
                    itemName: currentItem?.itemName || 'N/A',
                    orderId: order?.orderId,
                    orderDate: convertDate(order.date),
                    amount: currentItem?.amount ? convertCurrencyAmount(currentItem, currencies) : 'N/A',
                };
                return newOrder;
            });
            exportToCsv(currencyData);
            setIsLoading(false)
        } catch (e) {
            console.error(e)
            setIsLoading(false)
        }
    }

    return (
        <div onClick={handleClick} className="wrap-button">
            {isLoading ? (
                <div className="loading-content">
                    <div className="loading" />
                    <div>Loading</div>
                </div>
            ) : 'Download'}
        </div>
    );
};