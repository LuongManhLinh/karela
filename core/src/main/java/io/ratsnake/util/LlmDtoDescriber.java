package io.ratsnake.util;

import dev.langchain4j.model.output.structured.Description;
import dev.langchain4j.service.output.ServiceOutputParser;

import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class LlmDtoDescriber {
    private static final ServiceOutputParser parser = new ServiceOutputParser();
    private static final Pattern pattern = Pattern.compile("\\{.*}", Pattern.DOTALL);

    public String getDefaultLlmInstruction(Class<?> dtoClazz) {
        return parser.outputFormatInstructions(dtoClazz);
    }

    public String getFieldsDescription(Class<?> dtoClazz) {
        Matcher matcher = pattern.matcher(getDefaultLlmInstruction(dtoClazz));

        if (matcher.find()) {
            return matcher.group();
        } else {
            return "{}";
        }
    }

    public String getClassDescription(Class<?> dtoClazz) {
        if (dtoClazz.isAnnotationPresent(Description.class)) {
            return String.join(", ", dtoClazz.getAnnotation(Description.class).value());
        } else {
            return "";
        }
    }
}
