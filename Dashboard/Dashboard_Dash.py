import dash
from dash import html, dcc, Input, Output
import dash_bootstrap_components as dbc
import joblib
import pandas as pd

# Load model
model = joblib.load("/Training/best_model.pkl")

app = dash.Dash(__name__, external_stylesheets=[dbc.themes.CYBORG])

app.layout = dbc.Container([

    dbc.Row(
        dbc.Col(
            html.Div([
                html.H1("Student Grade Prediction", className="text-center"),
                html.P("AI Powered Academic Performance Predictor",
                       className="text-center text-muted")
            ]),
            width=12
        ),
        className="my-4"
    ),

    dbc.Row(
        dbc.Col(
            dbc.Card(
                dbc.CardBody([

                    html.H4("Student Information", className="mb-4"),

                    dbc.Row([
                        dbc.Col(dbc.Input(id="name", placeholder="Full Name"), md=6),
                        dbc.Col(dbc.Input(id="roll", placeholder="Roll Number"), md=6)
                    ], className="mb-3"),

                    dbc.Row([
                        dbc.Col(dbc.Input(id="calc1", type="number", placeholder="Calculus-1"), md=6),
                        dbc.Col(dbc.Input(id="calc2", type="number", placeholder="Calculus-2"), md=6)
                    ], className="mb-3"),

                    dbc.Row([
                        dbc.Col(dbc.Input(id="py1", type="number", placeholder="Python-1"), md=6),
                        dbc.Col(dbc.Input(id="py2", type="number", placeholder="Python-2"), md=6)
                    ], className="mb-3"),

                    dbc.Row([
                        dbc.Col(dbc.Input(id="sm1", type="number", placeholder="SM-1"), md=6)
                    ], className="mb-3"),

                    dbc.Button("Predict Grade", id="predict_btn",
                               color="primary", className="mt-3"),

                    html.H3(id="prediction_output",
                            className="text-center mt-4")

                ])
            ),
            md=8
        ),
        justify="center"
    )

], fluid=True)


@app.callback(
    Output("prediction_output", "children"),
    Input("predict_btn", "n_clicks"),
    Input("calc1", "value"),
    Input("calc2", "value"),
    Input("py1", "value"),
    Input("py2", "value"),
    Input("sm1", "value")
)
def predict(n, c1, c2, p1, p2, sm1):

    if n is None:
        return ""

    df = pd.DataFrame([[c1, c2, p1, p2, sm1]],
        columns=["Calculus-1","Calculus-2","Python-1","Python-2","SM-1"])

    pred = model.predict(df)[0]

    return f"Predicted Grade: {pred}"


if __name__ == "__main__":
    app.run(debug=True)