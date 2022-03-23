
const errorArgs = {
    title: String,
    errorCode: Number,
    fields: [
        {
            textContent: String,
            primary: Boolean
        }
    ],
    buttonText: String,
}

const createErrorField = (args = errorArgs) => {
    const error = document.createElement('div')
    error.className = 'error-container';

    const title = document.createElement('h1')
    title.textContent = args.title;

    const button = document.createElement('button');
    button.textContent = args.buttonText;
    
    error.appendChild(title);

    args.fields.forEach(field => {
        switch(field.primary){
            case true:
                const elementPrimary = document.createElement('h2');
                elementPrimary.textContent = field.textContent
                error.appendChild(elementPrimary);
                break;
            case false:
                const elementSecondary = document.createElement('h3');
                elementSecondary.textContent = field.textContent
                error.appendChild(elementSecondary);
                break;
        }
    });

    error.append(button);

    return {element: error, button: button};
}


module.exports = {
    createError: (args = errorArgs) => createErrorField(args)
}
