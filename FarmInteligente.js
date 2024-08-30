// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2024-08-29
// @description  Auto farm com assistente de saque para todas as suas aldeias
// @author       Edmundo Vitor
// @match        https://*.tribalwars.com.br/*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=tribalwars.com.br
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const FarmInteligente = new function () {

        const TemplatesEnum = {
            A: 'a',
            B: 'b',
        }

        var aldeiasSemTropas = [];

        const queryAldeiaFarm = "tr[id^='village_']:not([style='display: none;'])";
       
        const atualizaAldeiasSemTropas = (aldeiaAtual) => {
            aldeiasSemTropas.push(aldeiaAtual);
            localStorage.setItem("aldeiasSemTropas", JSON.stringify(aldeiasSemTropas));
        }

        const clickTemplate = (templateType, villageElement) => {
            const selector = `a.farm_icon.farm_icon_${templateType}`;
            const templateLink = villageElement.querySelector(selector);

            if (templateLink) {
                templateLink.click();
            }
        };

        const getTemplates = () => {
            return Accountmanager.farm.templates;
        };

        const getCurrentUnits = () => {
            return Accountmanager.farm.current_units;
        };

        const validaTropasSuficientes = (templateEscolhido) => {
            var tropas = getCurrentUnits();
            var templates = getTemplates();
            const [templateA, templateB] = Object.values(templates);

            for (const unidade in tropas) {
                const qtdUnidades = tropas[unidade];
                const qtdUnidadesTemplate = templateEscolhido === 'a' ? templateA[unidade] : templateB[unidade]
                
                if(qtdUnidadesTemplate && qtdUnidadesTemplate > qtdUnidades){
                    console.log("Tropas insuficientes")
                    return false;
                }
            }

            return true;
        }

        const atacar = (aldeiaAtual) => {
            if(!verificaCaptcha()) {
                var templateEscolhido = TemplatesEnum.A;
                
                if(validaTropasSuficientes(templateEscolhido)){
                    var aldeiaElement = document.querySelector(queryAldeiaFarm);
                    clickTemplate(templateEscolhido, aldeiaElement);
                } else {
                    console.log("Indo para a próxima aldeia...");
                    atualizaAldeiasSemTropas(aldeiaAtual);
                    var proximaAldeia = document.querySelector("#village_switch_right > span")
                    proximaAldeia.click();
                }
            }
        }

        const verificaCaptcha = () => {
            const captcha1 = document.querySelector("#botprotection_quest");
            const captcha2 = document.querySelector("#popup_box_bot_protection");

            if(captcha1 || captcha2){
                console.log("Captcha na área. Parando os trabalhos...")
                return true;
            }

            return false;
        }

        const limparAldeiasSemTropas = () => {
            console.log("Limpando")
            aldeiasSemTropas = [];
            localStorage.setItem("aldeiasSemTropas", JSON.stringify(aldeiasSemTropas));
        }

        const calculaTempoEspera = () => {
            // TODO: tempo de espera dinamico
            return 300000; // 5 min
        }

        const timer = ms => new Promise(res => setTimeout(res, ms))

        const passouTempoEspera = (tempoEsperaMs) => {
            const ultimaExecucao = localStorage.getItem('ultimaExecucao');
            const diferencaTempo = Date.now() - ultimaExecucao;

            if(diferencaTempo > tempoEsperaMs){
                return true;
            }

            return false;
        }

        const aguardarTempoEspera = async (tempoEsperaMs) => {
            var currentdate = new Date();
            console.log(`Todas as aldeias já estão sem tropas. Aguardando ${tempoEsperaMs/1000} segundos para reiniciar o farm...`)
            console.log(`Hora atual: ${currentdate.getHours()}:${currentdate.getMinutes()}`);
            await timer(tempoEsperaMs);
        }

        const atualizarUltimaExecucao = () => {
            localStorage.setItem('ultimaExecucao', Date.now());
        }

        const buscarAldeiaAtual = () => {
            const parametrosUrl = $("#menu_row2_village > a").attr("href").split("?")[1];
            const urlSearch = new URLSearchParams(parametrosUrl);
            return urlSearch.get("village");
        }

        const buscarAldeiasSemTropas = () => {
            const aldeiasSemTropas = JSON.parse(localStorage.getItem('aldeiasSemTropas')) || [];

            if(!aldeiasSemTropas) {
                aldeiasSemTropas = [];
            }

            return aldeiasSemTropas;
        }

        this.init = async () => {
            aldeiasSemTropas = buscarAldeiasSemTropas();

            console.log(`Aldeias sem tropas: ${aldeiasSemTropas}`);
            console.log("Começando a brincadeira...");

            const aldeiaAtual = buscarAldeiaAtual();

            if(!(aldeiasSemTropas.includes(aldeiaAtual))) {
                console.log(`Aldeia atual: ${aldeiaAtual}`);
                setInterval(async () => {
                    atacar(aldeiaAtual);
                }, 350);
                atualizarUltimaExecucao();
            } else {
                const tempoEsperaMs = calculaTempoEspera();

                if(!passouTempoEspera(tempoEsperaMs)) {
                    await aguardarTempoEspera(tempoEsperaMs);
                }

                limparAldeiasSemTropas();
                window.location.reload();
            }
        };
    };

    

    $(function () {
        if (typeof Accountmanager !== 'undefined' && Accountmanager.farm) {
            Accountmanager.farm.init();
            FarmInteligente.init();
        } else {
            console.error('Accountmanager or farm not defined');
        }
    });
})();