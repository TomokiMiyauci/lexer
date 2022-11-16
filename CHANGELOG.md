# [1.0.0-beta.2](https://github.com/TomokiMiyauci/lexer/compare/1.0.0-beta.1...1.0.0-beta.2) (2022-11-16)


### Features

* change lexer interface, error handling ([2da83ca](https://github.com/TomokiMiyauci/lexer/commit/2da83ca2c966106a93924e29b22ffa4763fbb55a))
* **lexer:** add changing eof token type ([a17737a](https://github.com/TomokiMiyauci/lexer/commit/a17737ab5490503bdd506529ba196c117f12fae2))
* **lexer:** add disabled eof token ([9e83d49](https://github.com/TomokiMiyauci/lexer/commit/9e83d498b8edeb1b7953e2c0fae9c20b86608e62))
* **lexer:** add eof token at end of token stream by default ([d5632a1](https://github.com/TomokiMiyauci/lexer/commit/d5632a1899f95b8c4b78816bc0e923f6cd15660e))
* **lexer:** add lexer option interface and change unknown type ([ad1d462](https://github.com/TomokiMiyauci/lexer/commit/ad1d462f55e17f5f205eef0e6ee999e379520bc4))
* **lexer:** add offset info to token ([72c46c6](https://github.com/TomokiMiyauci/lexer/commit/72c46c6bdc963b49581a972b830bad4c1fae0abe))
* **lexer:** add position info to result token ([826f3a7](https://github.com/TomokiMiyauci/lexer/commit/826f3a7f1eef76361fd72e9b3b95f09d97a8680b))
* **lexer:** change default unknown type ([d12119e](https://github.com/TomokiMiyauci/lexer/commit/d12119ed2d055bc8197b981983d98383063c243b))
* **lexer:** rename interface field name `unknownType` to `unknown` ([6836460](https://github.com/TomokiMiyauci/lexer/commit/683646085ecd95efd4ba26e0691ab5accb2a4d51))
* **types:** rename interface and alias ([a00af6a](https://github.com/TomokiMiyauci/lexer/commit/a00af6a7976e2dcaf5e08a1fc35df3a5d12d9c1d))


### Performance Improvements

* **lexer:** improve performance of string patterns ([4867e0e](https://github.com/TomokiMiyauci/lexer/commit/4867e0e9bd507d2ca188cdf20f70efa8df37b787))
* **utils:** change line break matching algorism ([d28e098](https://github.com/TomokiMiyauci/lexer/commit/d28e098023c5bd744a81c7d56358018ab0f3827b))

# 1.0.0-beta.1 (2022-09-02)


### Bug Fixes

* **lexer:** fix to not return EOF token when the lex is failed ([d1c5d90](https://github.com/TomokiMiyauci/lexer/commit/d1c5d90bafdfb793fd17c1b0b49be841aec50a7c))


### Features

* **laxer:** add offset property to each token ([f47eb6b](https://github.com/TomokiMiyauci/lexer/commit/f47eb6b7635275db0e0a7191d76b2211e4a8823d))
* **lexer:** accept offset arg that override initial offset ([c30445c](https://github.com/TomokiMiyauci/lexer/commit/c30445c9f724a1a76b200e02a0243a5ebdccd4d7))
* **lexer:** add asserting global flag of regex ([749d338](https://github.com/TomokiMiyauci/lexer/commit/749d338349542d65bcaebf22b56b5569ea51ffd0))
* **lexer:** add generic types for token type ([661ff11](https://github.com/TomokiMiyauci/lexer/commit/661ff11ffb821a75805e64b42492b50d64137152))
* **lexer:** add generics for token type ([ed7078e](https://github.com/TomokiMiyauci/lexer/commit/ed7078e9cb3ac14701f38d7008fc2c4af31e0c0b))
* **lexer:** add lex rule interface and accpet ignore flag ([f1bc0dd](https://github.com/TomokiMiyauci/lexer/commit/f1bc0dda9f087d45b276d769776a37a482d4cdfa))
* **lexer:** add Lexer class with basic lex logic ([22fc0d1](https://github.com/TomokiMiyauci/lexer/commit/22fc0d112e201b16a4af02f99c3ddf56fe9757e1))
* **lexer:** add merge regex flags ([0adde27](https://github.com/TomokiMiyauci/lexer/commit/0adde2717d6cd33e798733a11ad931755316f969))
* **lexer:** add offset value to return value ([b2b5a89](https://github.com/TomokiMiyauci/lexer/commit/b2b5a89f9b7f93c793ad0801a7677b2531288643))
* **lexer:** add treating EOF match pattern ([d59ef43](https://github.com/TomokiMiyauci/lexer/commit/d59ef43c002f2cb6ec887b9d5a7610d0e3b6cba1))
* **lexer:** change lex function interface ([0f121f4](https://github.com/TomokiMiyauci/lexer/commit/0f121f424394c7784f9cce527b879e1631316596))
* **lexer:** remove generic types for token type ([5272c39](https://github.com/TomokiMiyauci/lexer/commit/5272c39833a672cd422e25782f401673383f0970))
