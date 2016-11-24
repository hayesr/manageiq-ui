module ApplicationController::Filter
  Expression = Struct.new(
    :alias,
    :expression,
    :exp_array,
    :exp_available_tags,
    :exp_available_cfields,
    :exp_available_fields,
    :exp_cfield,
    :exp_check,
    :exp_ckey,
    :exp_chosen_report,
    :exp_chosen_search,
    :exp_cvalue,
    :exp_count,
    :exp_field,
    :exp_idx,
    :exp_key,
    :exp_last_loaded,
    :exp_mode,
    :exp_model,
    :exp_orig_key,
    :exp_regkey,
    :exp_regval,
    :exp_skey,
    :exp_search_expressions,
    :exp_table,
    :exp_tag,
    :exp_token,
    :exp_typ,
    :exp_value,
    :pre_qs_selected,
    :use_mytags,
    :selected,
    :val1,
    :val2,
    :record_filter
  ) do
    def calendar_needed?
      [val1, val2].compact.any? { |val| [:date, :datetime].include? val[:type] }
    end

    def render_values_to(page)
      if val1.try(:type)
        page << "ManageIQ.expEditor.first.type = '#{val1[:type]}';"
        page << "ManageIQ.expEditor.first.title = '#{val1[:title]}';"
      end
      if val2.try(:type)
        page << "ManageIQ.expEditor.second.type = '#{val2[:type]}';"
        page << "ManageIQ.expEditor.second.title = '#{val2[:title]}';"
      end
    end

    def val_type_for(key, field)
      if !self[key] || !self[field]
        nil
      elsif self[key].starts_with?('REG')
        :regexp
      else
        typ = MiqExpression.get_col_info(self[field])[:format_sub_type]
        if MiqExpression::FORMAT_SUB_TYPES.keys.include?(typ)
          typ
        else
          :string
        end
      end
    end
  end
  # TODO: expression is now manipulated with fetch_path
  # We need to extract methods using fetch_path to Expression to avoid the fetch_path call
  ApplicationController::Filter::Expression.send(:include, MoreCoreExtensions::Shared::Nested)
end
