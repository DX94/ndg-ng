/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package controllers;

import controllers.exceptions.SurveyXmlCreatorException;
import models.utils.NdgQuery;
import controllers.logic.SurveyXmlBuilder;
import models.NdgUser;
import models.TransactionLog;
import models.constants.TransactionlogConsts;
import controllers.util.PropertiesUtil;
import controllers.util.SettingsProperties;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;

import java.util.List;
import play.mvc.Controller;
import play.mvc.Http;

/**
 *
 * @author wojciech.luczkow
 */
public class Surveys extends Controller {

    public static void list() {

        List<TransactionLog> transactionList = TransactionLog.find("byNdg_user_idAndTransactionStatus",
                getCurrentUser().id,
                TransactionlogConsts.TransactionStatus.STATUS_AVAILABLE).fetch();
        ArrayList<TransactionLog> transactions = (ArrayList<TransactionLog>) transactionList;

        // TODO check if we could read it from PLAY ???
        String serverName = PropertiesUtil.getSettingsProperties().getProperty(SettingsProperties.URLSERVER,
                "http://localhost:9000");
        renderTemplate("surveys.xml", transactions, serverName);

    }

    public static void download(String formID) throws SurveyXmlCreatorException, IOException {

        TransactionLog transaction = TransactionLog.find("byNdg_user_idAndTransactionStatusAndSurvey_id",
                getCurrentUser().id,
                TransactionlogConsts.TransactionStatus.STATUS_AVAILABLE,
                formID).first();
        if (transaction == null) {
            error(Http.StatusCode.NOT_FOUND, "No survey for given client");
        } else {
            final Writer result = new StringWriter();
            final PrintWriter printWriter = new PrintWriter(result);

            SurveyXmlBuilder builder = new SurveyXmlBuilder();
            builder.printSurveyXml(transaction.survey, printWriter);
            transaction.transactionStatus = TransactionlogConsts.TransactionStatus.STATUS_SUCCESS;
            transaction.save();
            renderXml(result.toString());
        }
    }

    private static NdgUser getCurrentUser() {
        // TODO get userName from WWW-Authentication header
        String userName = "admin";
        return NdgQuery.getUserByUserName(userName);
    }
}
