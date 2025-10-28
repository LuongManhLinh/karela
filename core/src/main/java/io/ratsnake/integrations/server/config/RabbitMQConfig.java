package io.ratsnake.integrations.server.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {
    public static final String DEFECT_QUEUE = "defect.queue";
    public static final String DEFECT_EXCHANGE = "defect.exchange";
    public static final String DEFECT_ROUTING_KEY = "defect.routingKey";

    @Bean
    public Queue queue() {
        return new Queue(DEFECT_QUEUE, true); // durable queue
    }

    @Bean
    public DirectExchange exchange() {
        return new DirectExchange(DEFECT_EXCHANGE);
    }

    @Bean
    public Binding binding(Queue queue, DirectExchange exchange) {
        return BindingBuilder.bind(queue).to(exchange).with(DEFECT_ROUTING_KEY);
    }
}

