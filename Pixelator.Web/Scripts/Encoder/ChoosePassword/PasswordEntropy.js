CalculatePasswordEntropyInfo = function (Password) {
    var EntropyInfo =
         {
             SetLength: 0,
             EntropyPerCharacter: 0,
             TotalEntropy: 0
         };
    if (Password == undefined)
        return EntropyInfo;
    if (Password.length == 0)
        return EntropyInfo;

    EntropyInfo.SetLength = DetermineCharacterSetLength(Password);
    EntropyInfo.EntropyPerCharacter = Math.log(EntropyInfo.SetLength) / Math.log(2);
    EntropyInfo.TotalEntropy = EntropyInfo.EntropyPerCharacter * Password.length;

    return EntropyInfo;
}

DetermineCharacterSetLength = function (String) {
    if (String.length == 0)
        return 0;

    var SetLength = 0;

    if (StringContainsNonKeyboardCharacters(String)) {
        //Estimate from unicode char value
        for (var i = 0; i < String.length; i++) {
            var UnicodeValue = String.charCodeAt(i);
            if (SetLength < UnicodeValue)
                SetLength = UnicodeValue;
        }
        return SetLength;
    }

    if (NumbersRegex().test(String))
        SetLength += 10;
    if (LowerCaseLettersRegex().test(String))
        SetLength += 26;
    if (UpperCaseLettersRegex().test(String))
        SetLength += 26;
    if (KeyboardSymbolsRegex().test(String))
        SetLength += 33;

    return SetLength;
}

NumbersRegex = function () {
    return /\d+/;
}

LowerCaseLettersRegex = function () {
    return /[a-z]+/;
}

UpperCaseLettersRegex = function () {
    return /[A-Z]+/;
}

KeyboardSymbolsRegex = function () {
    return /[- !$#@%^&*()_+|~=`{}\[\]:";'<>?,.\/\\]/;
}

StringContainsNonKeyboardCharacters = function (String) {
    var LeftOverString = String
        .replace(new RegExp(NumbersRegex().source, 'g'), "")
        .replace(new RegExp(LowerCaseLettersRegex().source, 'g'), "")
        .replace(new RegExp(UpperCaseLettersRegex().source, 'g'), "")
        .replace(new RegExp(KeyboardSymbolsRegex().source, 'g'), "");

    return LeftOverString.length > 0;
}