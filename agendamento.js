class AgendamentoBarbearia {
    constructor() {
        this.agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [];
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        
        this.init();
    }

    init() {
        this.criarCalendario();
        this.criarHorarios();
        this.configurarEventos();
    }

    // Configura eventos do formulário
    configurarEventos() {
        const form = document.getElementById('agendamentoForm');
        form.addEventListener('submit', (e) => this.confirmarAgendamento(e));
        
        // Máscara para telefone
        const telefoneInput = document.getElementById('telefone');
        telefoneInput.addEventListener('input', (e) => {
            e.target.value = this.formatarTelefone(e.target.value);
        });
    }

    // Formata número de telefone
    formatarTelefone(telefone) {
        const numeros = telefone.replace(/\D/g, '');
        if (numeros.length <= 10) {
            return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else {
            return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
    }

    // Cria o calendário
    criarCalendario() {
        const calendar = document.getElementById('calendar');
        calendar.innerHTML = '';

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        // Cabeçalho do calendário
        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.textContent = this.getNomeMes(mesAtual) + ' ' + anoAtual;
        calendar.appendChild(header);

        // Dias da semana
        const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        diasSemana.forEach(dia => {
            const diaElement = document.createElement('div');
            diaElement.className = 'calendar-day';
            diaElement.style.fontWeight = 'bold';
            diaElement.textContent = dia;
            calendar.appendChild(diaElement);
        });

        // Dias do mês
        const primeiroDia = new Date(anoAtual, mesAtual, 1);
        const ultimoDia = new Date(anoAtual, mesAtual + 1, 0);
        
        // Espaços vazios antes do primeiro dia
        for (let i = 0; i < primeiroDia.getDay(); i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day disabled';
            calendar.appendChild(emptyDay);
        }

        // Dias do mês
        for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
            const data = new Date(anoAtual, mesAtual, dia);
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            dayElement.textContent = dia;
            dayElement.dataset.data = data.toISOString().split('T')[0];

            // Desabilita dias passados
            if (data < new Date().setHours(0, 0, 0, 0)) {
                dayElement.classList.add('disabled');
            } else {
                dayElement.addEventListener('click', () => this.selecionarData(data, dayElement));
            }

            calendar.appendChild(dayElement);
        }
    }

    // Seleciona uma data
    selecionarData(data, elemento) {
        // Remove seleção anterior
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Adiciona seleção atual
        elemento.classList.add('selected');
        this.dataSelecionada = data;

        // Atualiza horários disponíveis
        this.criarHorarios();
    }

    // Cria os horários disponíveis
    criarHorarios() {
        const timeSlots = document.getElementById('timeSlots');
        timeSlots.innerHTML = '';

        const horarios = this.gerarHorariosDisponiveis();
        
        horarios.forEach(horario => {
            const timeSlot = document.createElement('div');
            timeSlot.className = 'time-slot';
            timeSlot.textContent = horario;
            timeSlot.dataset.horario = horario;

            // Verifica se o horário está ocupado
            if (this.dataSelecionada && this.horarioOcupado(horario)) {
                timeSlot.classList.add('disabled');
            } else {
                timeSlot.addEventListener('click', () => this.selecionarHorario(horario, timeSlot));
            }

            timeSlots.appendChild(timeSlot);
        });
    }

    // Gera horários disponíveis (8h às 18h, de hora em hora)
    gerarHorariosDisponiveis() {
        const horarios = [];
        for (let hora = 8; hora <= 18; hora++) {
            horarios.push(`${hora.toString().padStart(2, '0')}:00`);
        }
        return horarios;
    }

    // Verifica se um horário está ocupado
    horarioOcupado(horario) {
        if (!this.dataSelecionada) return false;

        const dataFormatada = this.dataSelecionada.toISOString().split('T')[0];
        return this.agendamentos.some(agendamento => 
            agendamento.data === dataFormatada && agendamento.horario === horario
        );
    }

    // Seleciona um horário
    selecionarHorario(horario, elemento) {
        // Remove seleção anterior
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Adiciona seleção atual
        elemento.classList.add('selected');
        this.horarioSelecionado = horario;
    }

    // Confirma o agendamento
    confirmarAgendamento(e) {
        e.preventDefault();

        if (!this.validarFormulario()) {
            return;
        }

        const agendamento = {
            id: Date.now(),
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            servico: document.getElementById('servico').value,
            data: this.dataSelecionada.toISOString().split('T')[0],
            horario: this.horarioSelecionado,
            dataCriacao: new Date().toISOString()
        };

        this.agendamentos.push(agendamento);
        this.salvarAgendamentos();
        this.mostrarConfirmacao(agendamento);
        this.limparFormulario();
    }

    // Valida o formulário
    validarFormulario() {
        const nome = document.getElementById('nome').value;
        const telefone = document.getElementById('telefone').value;
        const servico = document.getElementById('servico').value;

        if (!nome || !telefone || !servico) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return false;
        }

        if (!this.dataSelecionada) {
            alert('Por favor, selecione uma data.');
            return false;
        }

        if (!this.horarioSelecionado) {
            alert('Por favor, selecione um horário.');
            return false;
        }

        return true;
    }

    // Salva agendamentos no localStorage
    salvarAgendamentos() {
        localStorage.setItem('agendamentos', JSON.stringify(this.agendamentos));
    }

    // Mostra confirmação do agendamento
    mostrarConfirmacao(agendamento) {
        const confirmation = document.getElementById('confirmation');
        const nomeServico = this.getNomeServico(agendamento.servico);
        
        confirmation.innerHTML = `
            <h3>Agendamento Confirmado!</h3>
            <p><strong>Nome:</strong> ${agendamento.nome}</p>
            <p><strong>Telefone:</strong> ${agendamento.telefone}</p>
            <p><strong>Serviço:</strong> ${nomeServico}</p>
            <p><strong>Data:</strong> ${this.formatarData(agendamento.data)}</p>
            <p><strong>Horário:</strong> ${agendamento.horario}</p>
        `;
        
        confirmation.style.display = 'block';
        
        // Esconde a confirmação após 10 segundos
        setTimeout(() => {
            confirmation.style.display = 'none';
        }, 10000);
    }

    // Limpa o formulário
    limparFormulario() {
        document.getElementById('agendamentoForm').reset();
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });
        document.querySelectorAll('.time-slot.selected').forEach(el => {
            el.classList.remove('selected');
        });
        this.dataSelecionada = null;
        this.horarioSelecionado = null;
        this.criarHorarios();
    }

    // Utilitários
    getNomeMes(mes) {
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        return meses[mes];
    }

    getNomeServico(codigo) {
        const servicos = {
            'corte': 'Corte de Cabelo - R$ 30',
            'barba': 'Barba - R$ 20',
            'combo': 'Corte + Barba - R$ 45',
            'pezinho': 'Pezinho - R$ 15'
        };
        return servicos[codigo] || codigo;
    }

    formatarData(data) {
        const [ano, mes, dia] = data.split('-');
        return `${dia}/${mes}/${ano}`;
    }
}

// Inicializa o sistema de agendamento quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    new AgendamentoBarbearia();
});