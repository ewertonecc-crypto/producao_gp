export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      alocacoes_recurso: {
        Row: {
          alocado_por: string | null
          aprovado_por: string | null
          atividade_id: string | null
          criado_em: string | null
          custo_estimado: number | null
          custo_realizado: number | null
          data_fim: string | null
          data_inicio: string
          horas_alocadas_semana: number | null
          id: string
          observacoes: string | null
          percentual_alocacao: number | null
          projeto_id: string
          recurso_id: string
          status: string | null
          tenant_id: string
        }
        Insert: {
          alocado_por?: string | null
          aprovado_por?: string | null
          atividade_id?: string | null
          criado_em?: string | null
          custo_estimado?: number | null
          custo_realizado?: number | null
          data_fim?: string | null
          data_inicio: string
          horas_alocadas_semana?: number | null
          id?: string
          observacoes?: string | null
          percentual_alocacao?: number | null
          projeto_id: string
          recurso_id: string
          status?: string | null
          tenant_id: string
        }
        Update: {
          alocado_por?: string | null
          aprovado_por?: string | null
          atividade_id?: string | null
          criado_em?: string | null
          custo_estimado?: number | null
          custo_realizado?: number | null
          data_fim?: string | null
          data_inicio?: string
          horas_alocadas_semana?: number | null
          id?: string
          observacoes?: string | null
          percentual_alocacao?: number | null
          projeto_id?: string
          recurso_id?: string
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alocacoes_recurso_alocado_por_fkey"
            columns: ["alocado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "v_gantt"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "v_kanban"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "v_carga_recurso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alocacoes_recurso_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          aceita_em: string | null
          aceita_por: string | null
          anexos: string[] | null
          atualizado_em: string | null
          categoria_id: string | null
          codigo: string | null
          coluna_kanban_ordem: number | null
          criado_em: string | null
          criado_por: string | null
          criterio_aceitacao: string
          custo_estimado: number | null
          custo_realizado: number | null
          data_fim_prevista: string
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          depende_de_ids: string[] | null
          descricao: string
          enviada_ao_cliente_em: string | null
          estimativa_horas: number | null
          evidencias: string[] | null
          hora_fim: string | null
          hora_inicio: string | null
          horas_realizadas: number | null
          id: string
          is_evento_agenda: boolean | null
          iteracao: number | null
          kanban_cor_etiqueta: string | null
          motivo_rejeicao: string | null
          nome: string
          observacoes: string | null
          percentual_concluido: number | null
          prioridade_id: string | null
          projeto_id: string
          recorrencia: string | null
          recorrencia_ate: string | null
          responsavel_id: string | null
          revisor_interno_id: string | null
          status_aceite: string | null
          status_id: string | null
          tenant_id: string
        }
        Insert: {
          aceita_em?: string | null
          aceita_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          categoria_id?: string | null
          codigo?: string | null
          coluna_kanban_ordem?: number | null
          criado_em?: string | null
          criado_por?: string | null
          criterio_aceitacao: string
          custo_estimado?: number | null
          custo_realizado?: number | null
          data_fim_prevista: string
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          depende_de_ids?: string[] | null
          descricao: string
          enviada_ao_cliente_em?: string | null
          estimativa_horas?: number | null
          evidencias?: string[] | null
          hora_fim?: string | null
          hora_inicio?: string | null
          horas_realizadas?: number | null
          id?: string
          is_evento_agenda?: boolean | null
          iteracao?: number | null
          kanban_cor_etiqueta?: string | null
          motivo_rejeicao?: string | null
          nome: string
          observacoes?: string | null
          percentual_concluido?: number | null
          prioridade_id?: string | null
          projeto_id: string
          recorrencia?: string | null
          recorrencia_ate?: string | null
          responsavel_id?: string | null
          revisor_interno_id?: string | null
          status_aceite?: string | null
          status_id?: string | null
          tenant_id: string
        }
        Update: {
          aceita_em?: string | null
          aceita_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          categoria_id?: string | null
          codigo?: string | null
          coluna_kanban_ordem?: number | null
          criado_em?: string | null
          criado_por?: string | null
          criterio_aceitacao?: string
          custo_estimado?: number | null
          custo_realizado?: number | null
          data_fim_prevista?: string
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          depende_de_ids?: string[] | null
          descricao?: string
          enviada_ao_cliente_em?: string | null
          estimativa_horas?: number | null
          evidencias?: string[] | null
          hora_fim?: string | null
          hora_inicio?: string | null
          horas_realizadas?: number | null
          id?: string
          is_evento_agenda?: boolean | null
          iteracao?: number | null
          kanban_cor_etiqueta?: string | null
          motivo_rejeicao?: string | null
          nome?: string
          observacoes?: string | null
          percentual_concluido?: number | null
          prioridade_id?: string | null
          projeto_id?: string
          recorrencia?: string | null
          recorrencia_ate?: string | null
          responsavel_id?: string | null
          revisor_interno_id?: string | null
          status_aceite?: string | null
          status_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_aceita_por_fkey"
            columns: ["aceita_por"]
            isOneToOne: false
            referencedRelation: "clientes_externos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias_atividade"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "atividades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_revisor_interno_id_fkey"
            columns: ["revisor_interno_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          acao: string
          campos_alterados: string[] | null
          criado_em: string | null
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          ip_address: string | null
          modulo: string
          registro_id: string | null
          registro_nome: string | null
          tenant_id: string | null
          user_agent: string | null
          usuario_id: string | null
        }
        Insert: {
          acao: string
          campos_alterados?: string[] | null
          criado_em?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          ip_address?: string | null
          modulo: string
          registro_id?: string | null
          registro_nome?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Update: {
          acao?: string
          campos_alterados?: string[] | null
          criado_em?: string | null
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          ip_address?: string | null
          modulo?: string
          registro_id?: string | null
          registro_nome?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias_atividade: {
        Row: {
          cor: string | null
          id: string
          is_ativo: boolean | null
          nome: string
          tenant_id: string
        }
        Insert: {
          cor?: string | null
          id?: string
          is_ativo?: boolean | null
          nome: string
          tenant_id: string
        }
        Update: {
          cor?: string | null
          id?: string
          is_ativo?: boolean | null
          nome?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_atividade_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes_externos: {
        Row: {
          criado_em: string | null
          email: string
          empresa: string | null
          id: string
          is_ativo: boolean | null
          nome: string
          projetos_ids: string[] | null
          telefone: string | null
          tenant_id: string
          token_expira_em: string | null
          token_portal: string | null
        }
        Insert: {
          criado_em?: string | null
          email: string
          empresa?: string | null
          id?: string
          is_ativo?: boolean | null
          nome: string
          projetos_ids?: string[] | null
          telefone?: string | null
          tenant_id: string
          token_expira_em?: string | null
          token_portal?: string | null
        }
        Update: {
          criado_em?: string | null
          email?: string
          empresa?: string | null
          id?: string
          is_ativo?: boolean | null
          nome?: string
          projetos_ids?: string[] | null
          telefone?: string | null
          tenant_id?: string
          token_expira_em?: string | null
          token_portal?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_externos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      comentarios: {
        Row: {
          autor_id: string
          criado_em: string | null
          editado_em: string | null
          entidade_id: string
          entidade_tipo: string
          id: string
          resposta_de_id: string | null
          tenant_id: string
          texto: string
        }
        Insert: {
          autor_id: string
          criado_em?: string | null
          editado_em?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          resposta_de_id?: string | null
          tenant_id: string
          texto: string
        }
        Update: {
          autor_id?: string
          criado_em?: string | null
          editado_em?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          resposta_de_id?: string | null
          tenant_id?: string
          texto?: string
        }
        Relationships: [
          {
            foreignKeyName: "comentarios_autor_id_fkey"
            columns: ["autor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_resposta_de_id_fkey"
            columns: ["resposta_de_id"]
            isOneToOne: false
            referencedRelation: "comentarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comentarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracoes_tenant: {
        Row: {
          atualizado_em: string | null
          cor_primaria: string | null
          dias_aviso_prazo: number | null
          exigir_aprovacao_interna: boolean | null
          id: string
          logo_url: string | null
          modulo_agenda: boolean | null
          modulo_calendario: boolean | null
          modulo_financeiro: boolean | null
          modulo_gantt: boolean | null
          modulo_kanban: boolean | null
          modulo_mapa_estrategico: boolean | null
          modulo_recursos: boolean | null
          modulo_riscos: boolean | null
          nome_sistema: string | null
          permitir_cliente_comentar: boolean | null
          prefixo_atividade: string | null
          prefixo_portfolio: string | null
          prefixo_programa: string | null
          prefixo_projeto: string | null
          tenant_id: string
        }
        Insert: {
          atualizado_em?: string | null
          cor_primaria?: string | null
          dias_aviso_prazo?: number | null
          exigir_aprovacao_interna?: boolean | null
          id?: string
          logo_url?: string | null
          modulo_agenda?: boolean | null
          modulo_calendario?: boolean | null
          modulo_financeiro?: boolean | null
          modulo_gantt?: boolean | null
          modulo_kanban?: boolean | null
          modulo_mapa_estrategico?: boolean | null
          modulo_recursos?: boolean | null
          modulo_riscos?: boolean | null
          nome_sistema?: string | null
          permitir_cliente_comentar?: boolean | null
          prefixo_atividade?: string | null
          prefixo_portfolio?: string | null
          prefixo_programa?: string | null
          prefixo_projeto?: string | null
          tenant_id: string
        }
        Update: {
          atualizado_em?: string | null
          cor_primaria?: string | null
          dias_aviso_prazo?: number | null
          exigir_aprovacao_interna?: boolean | null
          id?: string
          logo_url?: string | null
          modulo_agenda?: boolean | null
          modulo_calendario?: boolean | null
          modulo_financeiro?: boolean | null
          modulo_gantt?: boolean | null
          modulo_kanban?: boolean | null
          modulo_mapa_estrategico?: boolean | null
          modulo_recursos?: boolean | null
          modulo_riscos?: boolean | null
          nome_sistema?: string | null
          permitir_cliente_comentar?: boolean | null
          prefixo_atividade?: string | null
          prefixo_portfolio?: string | null
          prefixo_programa?: string | null
          prefixo_projeto?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "configuracoes_tenant_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      eventos_agenda: {
        Row: {
          cor: string | null
          criado_em: string | null
          criado_por: string | null
          data_fim: string | null
          data_inicio: string
          descricao: string | null
          dia_inteiro: boolean | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string
          lembrete_min: number | null
          link_reuniao: string | null
          local: string | null
          participantes: string[] | null
          portfolio_id: string | null
          programa_id: string | null
          projeto_id: string | null
          recorrencia: string | null
          recorrencia_ate: string | null
          responsavel_id: string | null
          tenant_id: string
          tipo: string | null
          titulo: string
        }
        Insert: {
          cor?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio: string
          descricao?: string | null
          dia_inteiro?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          lembrete_min?: number | null
          link_reuniao?: string | null
          local?: string | null
          participantes?: string[] | null
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          recorrencia?: string | null
          recorrencia_ate?: string | null
          responsavel_id?: string | null
          tenant_id: string
          tipo?: string | null
          titulo: string
        }
        Update: {
          cor?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_fim?: string | null
          data_inicio?: string
          descricao?: string | null
          dia_inteiro?: boolean | null
          hora_fim?: string | null
          hora_inicio?: string | null
          id?: string
          lembrete_min?: number | null
          link_reuniao?: string | null
          local?: string | null
          participantes?: string[] | null
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          recorrencia?: string | null
          recorrencia_ate?: string | null
          responsavel_id?: string | null
          tenant_id?: string
          tipo?: string | null
          titulo?: string
        }
        Relationships: [
          {
            foreignKeyName: "eventos_agenda_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "eventos_agenda_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["programa_id"]
          },
          {
            foreignKeyName: "eventos_agenda_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "eventos_agenda_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "eventos_agenda_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      licoes_aprendidas: {
        Row: {
          categoria: string | null
          criado_em: string | null
          descricao: string
          id: string
          impacto: string | null
          portfolio_id: string | null
          programa_id: string | null
          projeto_id: string | null
          recomendacao: string
          registrado_por: string | null
          tenant_id: string
        }
        Insert: {
          categoria?: string | null
          criado_em?: string | null
          descricao: string
          id?: string
          impacto?: string | null
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          recomendacao: string
          registrado_por?: string | null
          tenant_id: string
        }
        Update: {
          categoria?: string | null
          criado_em?: string | null
          descricao?: string
          id?: string
          impacto?: string | null
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          recomendacao?: string
          registrado_por?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "licoes_aprendidas_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licoes_aprendidas_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "licoes_aprendidas_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licoes_aprendidas_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["programa_id"]
          },
          {
            foreignKeyName: "licoes_aprendidas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licoes_aprendidas_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "licoes_aprendidas_registrado_por_fkey"
            columns: ["registrado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "licoes_aprendidas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      marcos: {
        Row: {
          cor: string | null
          criado_em: string | null
          data_prevista: string
          data_real: string | null
          descricao: string | null
          hora_inicio: string | null
          id: string
          is_critico: boolean | null
          nome: string
          portfolio_id: string | null
          programa_id: string | null
          projeto_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          cor?: string | null
          criado_em?: string | null
          data_prevista: string
          data_real?: string | null
          descricao?: string | null
          hora_inicio?: string | null
          id?: string
          is_critico?: boolean | null
          nome: string
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          cor?: string | null
          criado_em?: string | null
          data_prevista?: string
          data_real?: string | null
          descricao?: string | null
          hora_inicio?: string | null
          id?: string
          is_critico?: boolean | null
          nome?: string
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marcos_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marcos_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "marcos_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marcos_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["programa_id"]
          },
          {
            foreignKeyName: "marcos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marcos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "marcos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mudancas_escopo: {
        Row: {
          aprovado_por: string | null
          data_aprovacao: string | null
          data_solicitacao: string | null
          descricao: string
          id: string
          impacto_custo: number | null
          impacto_prazo: number | null
          justificativa: string
          projeto_id: string
          solicitado_por: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          aprovado_por?: string | null
          data_aprovacao?: string | null
          data_solicitacao?: string | null
          descricao: string
          id?: string
          impacto_custo?: number | null
          impacto_prazo?: number | null
          justificativa: string
          projeto_id: string
          solicitado_por?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          aprovado_por?: string | null
          data_aprovacao?: string | null
          data_solicitacao?: string | null
          descricao?: string
          id?: string
          impacto_custo?: number | null
          impacto_prazo?: number | null
          justificativa?: string
          projeto_id?: string
          solicitado_por?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mudancas_escopo_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudancas_escopo_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudancas_escopo_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "mudancas_escopo_solicitado_por_fkey"
            columns: ["solicitado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mudancas_escopo_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          cliente_id: string | null
          criado_em: string | null
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          lida: boolean | null
          lida_em: string | null
          link: string | null
          mensagem: string | null
          tenant_id: string
          tipo: string
          titulo: string
          usuario_id: string | null
        }
        Insert: {
          cliente_id?: string | null
          criado_em?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          tenant_id: string
          tipo: string
          titulo: string
          usuario_id?: string | null
        }
        Update: {
          cliente_id?: string | null
          criado_em?: string | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          link?: string | null
          mensagem?: string | null
          tenant_id?: string
          tipo?: string
          titulo?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes_externos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      papeis: {
        Row: {
          descricao: string | null
          id: string
          is_ativo: boolean | null
          is_sistema: boolean | null
          nivel: number
          nome: string
          permissoes: Json | null
          tenant_id: string | null
        }
        Insert: {
          descricao?: string | null
          id?: string
          is_ativo?: boolean | null
          is_sistema?: boolean | null
          nivel?: number
          nome: string
          permissoes?: Json | null
          tenant_id?: string | null
        }
        Update: {
          descricao?: string | null
          id?: string
          is_ativo?: boolean | null
          is_sistema?: boolean | null
          nivel?: number
          nome?: string
          permissoes?: Json | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "papeis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          aceite_em: string | null
          aceite_por: string | null
          anexos: string[] | null
          atualizado_em: string | null
          codigo: string | null
          cor_mapa: string | null
          criado_em: string | null
          criado_por: string | null
          custo_realizado: number | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          descricao: string | null
          gestor_id: string | null
          id: string
          justificativa: string
          licoes_aprendidas: string | null
          nome: string
          objetivo: string
          observacoes: string | null
          orcamento_previsto: number | null
          patrocinador_id: string | null
          prioridade_id: string | null
          resultado_final: string | null
          status_id: string | null
          tenant_id: string
          tipo_id: string | null
        }
        Insert: {
          aceite_em?: string | null
          aceite_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          codigo?: string | null
          cor_mapa?: string | null
          criado_em?: string | null
          criado_por?: string | null
          custo_realizado?: number | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          justificativa: string
          licoes_aprendidas?: string | null
          nome: string
          objetivo: string
          observacoes?: string | null
          orcamento_previsto?: number | null
          patrocinador_id?: string | null
          prioridade_id?: string | null
          resultado_final?: string | null
          status_id?: string | null
          tenant_id: string
          tipo_id?: string | null
        }
        Update: {
          aceite_em?: string | null
          aceite_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          codigo?: string | null
          cor_mapa?: string | null
          criado_em?: string | null
          criado_por?: string | null
          custo_realizado?: number | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          descricao?: string | null
          gestor_id?: string | null
          id?: string
          justificativa?: string
          licoes_aprendidas?: string | null
          nome?: string
          objetivo?: string
          observacoes?: string | null
          orcamento_previsto?: number | null
          patrocinador_id?: string | null
          prioridade_id?: string | null
          resultado_final?: string | null
          status_id?: string | null
          tenant_id?: string
          tipo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_aceite_por_fkey"
            columns: ["aceite_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_cadastro"
            referencedColumns: ["id"]
          },
        ]
      }
      prioridades: {
        Row: {
          cor: string | null
          id: string
          is_ativo: boolean | null
          nome: string
          ordem: number
          tenant_id: string
        }
        Insert: {
          cor?: string | null
          id?: string
          is_ativo?: boolean | null
          nome: string
          ordem?: number
          tenant_id: string
        }
        Update: {
          cor?: string | null
          id?: string
          is_ativo?: boolean | null
          nome?: string
          ordem?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prioridades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      programas: {
        Row: {
          aceite_em: string | null
          aceite_por: string | null
          anexos: string[] | null
          atualizado_em: string | null
          codigo: string | null
          cor_mapa: string | null
          criado_em: string | null
          criado_por: string | null
          custo_realizado: number | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          escopo: string | null
          gestor_id: string | null
          id: string
          justificativa: string
          licoes_aprendidas: string | null
          nome: string
          objetivo: string
          observacoes: string | null
          orcamento_previsto: number | null
          patrocinador_id: string | null
          portfolio_id: string
          prioridade_id: string | null
          resultado_final: string | null
          status_id: string | null
          tenant_id: string
          tipo_id: string | null
        }
        Insert: {
          aceite_em?: string | null
          aceite_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          codigo?: string | null
          cor_mapa?: string | null
          criado_em?: string | null
          criado_por?: string | null
          custo_realizado?: number | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          escopo?: string | null
          gestor_id?: string | null
          id?: string
          justificativa: string
          licoes_aprendidas?: string | null
          nome: string
          objetivo: string
          observacoes?: string | null
          orcamento_previsto?: number | null
          patrocinador_id?: string | null
          portfolio_id: string
          prioridade_id?: string | null
          resultado_final?: string | null
          status_id?: string | null
          tenant_id: string
          tipo_id?: string | null
        }
        Update: {
          aceite_em?: string | null
          aceite_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          codigo?: string | null
          cor_mapa?: string | null
          criado_em?: string | null
          criado_por?: string | null
          custo_realizado?: number | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          escopo?: string | null
          gestor_id?: string | null
          id?: string
          justificativa?: string
          licoes_aprendidas?: string | null
          nome?: string
          objetivo?: string
          observacoes?: string | null
          orcamento_previsto?: number | null
          patrocinador_id?: string | null
          portfolio_id?: string
          prioridade_id?: string | null
          resultado_final?: string | null
          status_id?: string | null
          tenant_id?: string
          tipo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "programas_aceite_por_fkey"
            columns: ["aceite_por"]
            isOneToOne: false
            referencedRelation: "clientes_externos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "programas_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_cadastro"
            referencedColumns: ["id"]
          },
        ]
      }
      projetos: {
        Row: {
          aceite_em: string | null
          aceite_por: string | null
          anexos: string[] | null
          atualizado_em: string | null
          avaliacao_equipe: string | null
          codigo: string | null
          cor_mapa: string | null
          criado_em: string | null
          criado_por: string | null
          criterios_sucesso: string | null
          custo_estimado_recursos: number | null
          custo_realizado: number | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          escopo: string
          fora_do_escopo: string | null
          gerente_projeto_id: string | null
          icone_mapa: string | null
          id: string
          justificativa: string
          licoes_aprendidas: string | null
          nome: string
          objetivo: string
          observacoes: string | null
          orcamento_previsto: number | null
          patrocinador_id: string | null
          posicao_x: number | null
          posicao_y: number | null
          premissas: string | null
          prioridade_id: string | null
          programa_id: string
          progresso_percentual: number | null
          responsavel_tecnico_id: string | null
          restricoes: string | null
          resultado_final: string | null
          reticencias_mapa: string | null
          status_id: string | null
          tenant_id: string
          tipo_id: string | null
        }
        Insert: {
          aceite_em?: string | null
          aceite_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          avaliacao_equipe?: string | null
          codigo?: string | null
          cor_mapa?: string | null
          criado_em?: string | null
          criado_por?: string | null
          criterios_sucesso?: string | null
          custo_estimado_recursos?: number | null
          custo_realizado?: number | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          escopo: string
          fora_do_escopo?: string | null
          gerente_projeto_id?: string | null
          icone_mapa?: string | null
          id?: string
          justificativa: string
          licoes_aprendidas?: string | null
          nome: string
          objetivo: string
          observacoes?: string | null
          orcamento_previsto?: number | null
          patrocinador_id?: string | null
          posicao_x?: number | null
          posicao_y?: number | null
          premissas?: string | null
          prioridade_id?: string | null
          programa_id: string
          progresso_percentual?: number | null
          responsavel_tecnico_id?: string | null
          restricoes?: string | null
          resultado_final?: string | null
          reticencias_mapa?: string | null
          status_id?: string | null
          tenant_id: string
          tipo_id?: string | null
        }
        Update: {
          aceite_em?: string | null
          aceite_por?: string | null
          anexos?: string[] | null
          atualizado_em?: string | null
          avaliacao_equipe?: string | null
          codigo?: string | null
          cor_mapa?: string | null
          criado_em?: string | null
          criado_por?: string | null
          criterios_sucesso?: string | null
          custo_estimado_recursos?: number | null
          custo_realizado?: number | null
          data_fim_prevista?: string | null
          data_fim_real?: string | null
          data_inicio_prevista?: string | null
          data_inicio_real?: string | null
          escopo?: string
          fora_do_escopo?: string | null
          gerente_projeto_id?: string | null
          icone_mapa?: string | null
          id?: string
          justificativa?: string
          licoes_aprendidas?: string | null
          nome?: string
          objetivo?: string
          observacoes?: string | null
          orcamento_previsto?: number | null
          patrocinador_id?: string | null
          posicao_x?: number | null
          posicao_y?: number | null
          premissas?: string | null
          prioridade_id?: string | null
          programa_id?: string
          progresso_percentual?: number | null
          responsavel_tecnico_id?: string | null
          restricoes?: string | null
          resultado_final?: string | null
          reticencias_mapa?: string | null
          status_id?: string | null
          tenant_id?: string
          tipo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projetos_aceite_por_fkey"
            columns: ["aceite_por"]
            isOneToOne: false
            referencedRelation: "clientes_externos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_gerente_projeto_id_fkey"
            columns: ["gerente_projeto_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_patrocinador_id_fkey"
            columns: ["patrocinador_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["programa_id"]
          },
          {
            foreignKeyName: "projetos_responsavel_tecnico_id_fkey"
            columns: ["responsavel_tecnico_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_tipo_id_fkey"
            columns: ["tipo_id"]
            isOneToOne: false
            referencedRelation: "tipos_cadastro"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos: {
        Row: {
          capacidade_horas_semana: number | null
          criado_em: string | null
          custo_hora: number | null
          descricao: string | null
          disponivel_ate: string | null
          disponivel_de: string | null
          id: string
          is_ativo: boolean | null
          moeda: string | null
          nome: string
          observacoes: string | null
          status_id: string | null
          tags: string[] | null
          tenant_id: string
          tipo_recurso_id: string | null
          usuario_id: string | null
        }
        Insert: {
          capacidade_horas_semana?: number | null
          criado_em?: string | null
          custo_hora?: number | null
          descricao?: string | null
          disponivel_ate?: string | null
          disponivel_de?: string | null
          id?: string
          is_ativo?: boolean | null
          moeda?: string | null
          nome: string
          observacoes?: string | null
          status_id?: string | null
          tags?: string[] | null
          tenant_id: string
          tipo_recurso_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          capacidade_horas_semana?: number | null
          criado_em?: string | null
          custo_hora?: number | null
          descricao?: string | null
          disponivel_ate?: string | null
          disponivel_de?: string | null
          id?: string
          is_ativo?: boolean | null
          moeda?: string | null
          nome?: string
          observacoes?: string | null
          status_id?: string | null
          tags?: string[] | null
          tenant_id?: string
          tipo_recurso_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_tipo_recurso_id_fkey"
            columns: ["tipo_recurso_id"]
            isOneToOne: false
            referencedRelation: "tipos_recurso"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      riscos: {
        Row: {
          causa: string | null
          consequencia: string | null
          criado_em: string | null
          descricao: string
          estrategia: string | null
          id: string
          impacto: string | null
          nivel_risco: string | null
          plano_resposta: string | null
          probabilidade: string | null
          projeto_id: string
          responsavel_id: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          causa?: string | null
          consequencia?: string | null
          criado_em?: string | null
          descricao: string
          estrategia?: string | null
          id?: string
          impacto?: string | null
          nivel_risco?: string | null
          plano_resposta?: string | null
          probabilidade?: string | null
          projeto_id: string
          responsavel_id?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          causa?: string | null
          consequencia?: string | null
          criado_em?: string | null
          descricao?: string
          estrategia?: string | null
          id?: string
          impacto?: string | null
          nivel_risco?: string | null
          plano_resposta?: string | null
          probabilidade?: string | null
          projeto_id?: string
          responsavel_id?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "riscos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "riscos_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "riscos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stakeholders: {
        Row: {
          cliente_externo_id: string | null
          criado_em: string | null
          email_avulso: string | null
          id: string
          influencia: string | null
          interesse: string | null
          nome_avulso: string | null
          observacoes: string | null
          papel_descricao: string | null
          portfolio_id: string | null
          programa_id: string | null
          projeto_id: string | null
          tenant_id: string
          usuario_id: string | null
        }
        Insert: {
          cliente_externo_id?: string | null
          criado_em?: string | null
          email_avulso?: string | null
          id?: string
          influencia?: string | null
          interesse?: string | null
          nome_avulso?: string | null
          observacoes?: string | null
          papel_descricao?: string | null
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          tenant_id: string
          usuario_id?: string | null
        }
        Update: {
          cliente_externo_id?: string | null
          criado_em?: string | null
          email_avulso?: string | null
          id?: string
          influencia?: string | null
          interesse?: string | null
          nome_avulso?: string | null
          observacoes?: string | null
          papel_descricao?: string | null
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          tenant_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stakeholders_cliente_externo_id_fkey"
            columns: ["cliente_externo_id"]
            isOneToOne: false
            referencedRelation: "clientes_externos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "stakeholders_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["programa_id"]
          },
          {
            foreignKeyName: "stakeholders_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "stakeholders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stakeholders_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      status: {
        Row: {
          cor: string | null
          criado_em: string | null
          descricao: string | null
          fase: string | null
          icone: string | null
          id: string
          is_ativo: boolean | null
          is_final: boolean | null
          is_inicial: boolean | null
          modulo: string
          nome: string
          ordem: number
          tenant_id: string
        }
        Insert: {
          cor?: string | null
          criado_em?: string | null
          descricao?: string | null
          fase?: string | null
          icone?: string | null
          id?: string
          is_ativo?: boolean | null
          is_final?: boolean | null
          is_inicial?: boolean | null
          modulo: string
          nome: string
          ordem?: number
          tenant_id: string
        }
        Update: {
          cor?: string | null
          criado_em?: string | null
          descricao?: string | null
          fase?: string | null
          icone?: string | null
          id?: string
          is_ativo?: boolean | null
          is_final?: boolean | null
          is_inicial?: boolean | null
          modulo?: string
          nome?: string
          ordem?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          atualizado_em: string | null
          criado_em: string | null
          id: string
          nome: string
          plano: string | null
          slug: string | null
          status: string | null
          trial_ate: string | null
        }
        Insert: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          nome: string
          plano?: string | null
          slug?: string | null
          status?: string | null
          trial_ate?: string | null
        }
        Update: {
          atualizado_em?: string | null
          criado_em?: string | null
          id?: string
          nome?: string
          plano?: string | null
          slug?: string | null
          status?: string | null
          trial_ate?: string | null
        }
        Relationships: []
      }
      tipos_cadastro: {
        Row: {
          descricao: string | null
          id: string
          is_ativo: boolean | null
          modulo: string
          nome: string
          tenant_id: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          is_ativo?: boolean | null
          modulo: string
          nome: string
          tenant_id: string
        }
        Update: {
          descricao?: string | null
          id?: string
          is_ativo?: boolean | null
          modulo?: string
          nome?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_cadastro_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tipos_recurso: {
        Row: {
          descricao: string | null
          id: string
          is_ativo: boolean | null
          nome: string
          tenant_id: string
        }
        Insert: {
          descricao?: string | null
          id?: string
          is_ativo?: boolean | null
          nome: string
          tenant_id: string
        }
        Update: {
          descricao?: string | null
          id?: string
          is_ativo?: boolean | null
          nome?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tipos_recurso_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      usuario_projeto_papel: {
        Row: {
          atribuido_em: string | null
          atribuido_por: string | null
          id: string
          is_ativo: boolean | null
          papel_id: string
          portfolio_id: string | null
          programa_id: string | null
          projeto_id: string | null
          tenant_id: string
          usuario_id: string
          valido_ate: string | null
        }
        Insert: {
          atribuido_em?: string | null
          atribuido_por?: string | null
          id?: string
          is_ativo?: boolean | null
          papel_id: string
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          tenant_id: string
          usuario_id: string
          valido_ate?: string | null
        }
        Update: {
          atribuido_em?: string | null
          atribuido_por?: string | null
          id?: string
          is_ativo?: boolean | null
          papel_id?: string
          portfolio_id?: string | null
          programa_id?: string | null
          projeto_id?: string | null
          tenant_id?: string
          usuario_id?: string
          valido_ate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuario_projeto_papel_atribuido_por_fkey"
            columns: ["atribuido_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_papel_id_fkey"
            columns: ["papel_id"]
            isOneToOne: false
            referencedRelation: "papeis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["portfolio_id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "programas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_programa_id_fkey"
            columns: ["programa_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["programa_id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuario_projeto_papel_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          convidado_em: string | null
          convidado_por: string | null
          criado_em: string | null
          departamento: string | null
          email: string
          id: string
          is_ativo: boolean | null
          nome: string
          papel_global: string
          telefone: string | null
          tenant_id: string
          ultimo_acesso: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          convidado_em?: string | null
          convidado_por?: string | null
          criado_em?: string | null
          departamento?: string | null
          email: string
          id: string
          is_ativo?: boolean | null
          nome: string
          papel_global?: string
          telefone?: string | null
          tenant_id: string
          ultimo_acesso?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          convidado_em?: string | null
          convidado_por?: string | null
          criado_em?: string | null
          departamento?: string | null
          email?: string
          id?: string
          is_ativo?: boolean | null
          nome?: string
          papel_global?: string
          telefone?: string | null
          tenant_id?: string
          ultimo_acesso?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_convidado_por_fkey"
            columns: ["convidado_por"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usuarios_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_agenda: {
        Row: {
          cor_override: string | null
          data_fim: string | null
          data_inicio: string | null
          hora_fim: string | null
          hora_inicio: string | null
          id: string | null
          prioridade_id: string | null
          projeto_id: string | null
          responsavel_id: string | null
          status_id: string | null
          tenant_id: string | null
          tipo_evento: string | null
          titulo: string | null
        }
        Relationships: []
      }
      v_carga_recurso: {
        Row: {
          capacidade_horas_semana: number | null
          id: string | null
          nome: string | null
          situacao: string | null
          tenant_id: string | null
          total_alocado: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recursos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_gantt: {
        Row: {
          codigo: string | null
          data_fim_prevista: string | null
          data_fim_real: string | null
          data_inicio_prevista: string | null
          data_inicio_real: string | null
          depende_de_ids: string[] | null
          duracao_planejada_dias: number | null
          esta_atrasada: boolean | null
          id: string | null
          nome: string | null
          percentual_concluido: number | null
          projeto_fim: string | null
          projeto_id: string | null
          projeto_inicio: string | null
          projeto_nome: string | null
          responsavel_id: string | null
          status_id: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "atividades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_kanban: {
        Row: {
          card_ordem: number | null
          codigo: string | null
          coluna_ordem: number | null
          data_fim_prevista: string | null
          esta_atrasada: boolean | null
          id: string | null
          kanban_cor_etiqueta: string | null
          nome: string | null
          percentual_concluido: number | null
          prioridade_id: string | null
          projeto_id: string | null
          responsavel_id: string | null
          status_cor: string | null
          status_id: string | null
          status_nome: string | null
          tenant_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "atividades_prioridade_id_fkey"
            columns: ["prioridade_id"]
            isOneToOne: false
            referencedRelation: "prioridades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "projetos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_projeto_id_fkey"
            columns: ["projeto_id"]
            isOneToOne: false
            referencedRelation: "v_mapa_estrategico"
            referencedColumns: ["projeto_id"]
          },
          {
            foreignKeyName: "atividades_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "status"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      v_mapa_estrategico: {
        Row: {
          data_fim_prevista: string | null
          gerente_projeto_id: string | null
          portfolio_codigo: string | null
          portfolio_cor: string | null
          portfolio_gestor: string | null
          portfolio_id: string | null
          portfolio_nome: string | null
          portfolio_status: string | null
          portfolio_status_cor: string | null
          programa_codigo: string | null
          programa_cor: string | null
          programa_gestor: string | null
          programa_id: string | null
          programa_nome: string | null
          programa_status: string | null
          programa_status_cor: string | null
          progresso_percentual: number | null
          projeto_codigo: string | null
          projeto_cor: string | null
          projeto_icone: string | null
          projeto_id: string | null
          projeto_nome: string | null
          projeto_status: string | null
          projeto_status_cor: string | null
          saude_projeto: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_gestor_id_fkey"
            columns: ["portfolio_gestor"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programas_gestor_id_fkey"
            columns: ["programa_gestor"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projetos_gerente_projeto_id_fkey"
            columns: ["gerente_projeto_id"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_mover_barra_gantt: {
        Args: {
          p_atividade_id: string
          p_data_fim: string
          p_data_inicio: string
          p_percentual_concluido?: number | null
        }
        Returns: null
      }
      fn_mover_card_kanban: {
        Args: {
          p_atividade_id: string
          p_nova_ordem: number
          p_novo_status_id: string
        }
        Returns: null
      }
      fn_mover_evento_agenda: {
        Args: {
          p_atividade_id: string
          p_data_fim?: string | null
          p_data_inicio: string
          p_hora_fim?: string | null
          p_hora_inicio?: string | null
        }
        Returns: null
      }
      fn_reordenar_coluna_kanban: {
        Args: { p_ids_em_ordem: string[] }
        Returns: null
      }
      fn_tenant_id: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
